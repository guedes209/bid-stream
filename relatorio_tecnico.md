# Relatório Técnico de Arquitetura: BidStream

Este documento detalha as principais decisões arquiteturais e funcionalidades avançadas implementadas na plataforma de leilões, com foco em resiliência, tempo real e inteligência artificial.

---

## 1. Concorrência, ACID e Optimistic Locking

Em um sistema de leilão em tempo real, o maior risco é a **Condição de Corrida (Race Condition)**. Se dois usuários tentarem dar um lance no mesmo milissegundo, uma API mal protegida poderia validar ambos, resultando em dados corrompidos.

Para resolver isso, adotamos o **Optimistic Concurrency Control (OCC)** garantido pelos princípios ACID do PostgreSQL via Prisma ORM.

### Como funciona no Código:
No arquivo do banco de dados (`backend/prisma/schema.prisma`), implementamos um campo controlador de versão:
```prisma
model Auction {
  id            String   @id @default(uuid())
  // ...
  currentPrice  Float
  version       Int      @default(1) // <-- Controlador de Concorrência
}
```

Na rota de processamento do lance (`backend/src/controllers/auctionController.ts`), exigimos que o banco só permita o `UPDATE` se a versão recebida ainda for a versão atual do banco:
```typescript
// 1. Busca a versão exata que o usuário visualizou
const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

// 2. Tenta fazer a atualização (Optimistic Lock)
const updatedAuction = await prisma.auction.update({
  where: { 
    id: auctionId, 
    version: auction.version // A transação FALHA se a versão tiver mudado
  },
  data: { 
    currentPrice: amount, 
    version: { increment: 1 } // Incrementa a versão no ato do update
  }
});
```

Se o `UPDATE` falhar (porque outro usuário atualizou primeiro e a versão mudou), o Prisma lança o erro de transação **P2025**, que nós interceptamos graciosamente:
```typescript
} catch (error: any) {
  if (error?.code === 'P2025') {
    return res.status(409).json({ 
       error: 'Conflito de concorrência: Um lance maior foi computado no mesmo milissegundo.' 
    });
  }
}
```

---

## 2. Tempo Real com WebSockets (Socket.io)

Para garantir que todos os participantes vejam os lances instantaneamente sem precisarem recarregar a página (Polling), utilizamos o **Socket.io**.

### No Backend (`backend/src/controllers/auctionController.ts`):
Assim que o lance passa pela proteção ACID e é salvo no banco, usamos o servidor de socket para emitir o evento exclusivamente para a "Sala" (Room) daquele leilão:
```typescript
if (io) {
  io.to(`auction_${auctionId}`).emit('newBid', { 
    auction: updatedAuction, 
    bid 
  });
}
```

### No Frontend (`frontend/src/app/auction/[id]/page.tsx`):
O React escuta ativamente o canal e atualiza o Gráfico de Preços (Recharts) e o Ticker de Atividades (Top-Down) de forma instantânea e protegida contra duplicações (Strict Mode fix):
```typescript
socket = io(API_URL);
socket.emit('joinAuction', currentAuction.id); // Isola os eventos por sala

socket.on('newBid', (payload) => {
  setEvents(prev => {
    // Deduplicação estrita via Banco de Dados
    if (prev.some(ev => ev.id === payload.bid.id)) return prev;
    
    // Injeção de estado reativo (Ticker de 20 posições)
    return [{
       id: payload.bid.id,
       message: `Lance registrado: R$ ${payload.bid.amount}`,
       timestamp: new Date()
    }, ...prev].slice(0, 20);
  });
});
```

---

## 3. Mensageria Assíncrona com Redis e BullMQ

Processar chamadas de LLM (Inteligência Artificial) costuma demorar entre 1 a 3 segundos. Se fizéssemos isso na mesma requisição do lance, a API principal de Node.js (que é *Single-Threaded*) ficaria bloqueada. 
A solução foi implementar processamento assíncrono utilizando o **Redis** (Upstash) e a biblioteca de filas **BullMQ**.

### Publicando o Trabalho (`backend/src/controllers/auctionController.ts`):
O controlador responde o sucesso do lance para o usuário na mesma hora, mas joga a tarefa "pesada" para segundo plano na fila do Redis:
```typescript
// O usuário recebe o HTTP 200 OK antes mesmo da IA pensar
await aiQueue.add('generate-hype', { 
  auctionId, 
  currentBid: amount, 
  bidderName: bid.bidder.name 
});
return res.status(200).json({ success: true });
```

### O Worker Assíncrono (`backend/src/workers/aiWorker.ts`):
O Worker (que pode até ser hospedado em outro servidor para escalar horizontalmente) escuta o Redis e consome a fila no seu próprio ritmo, sem atrasar o leilão.

---

## 4. O Diferencial: IA Generativa Integrada (O Leiloeiro)

Utilizando a API do **Google Gemini (3.5-Flash)**, transformamos o leilão em um evento interativo. A IA atua como um leiloeiro persuasivo que reage aos eventos da sala de forma quase instantânea.

### A. Implementação do Prompt e Disparo
O Worker do BullMQ pega os dados do lance e manda para o Gemini com uma diretriz clara de comportamento (Role-play). 
Após o processamento (cerca de 2.5 segundos depois do lance real), o próprio Worker despacha a mensagem de volta para o Socket:
```typescript
// Retorna a mensagem hypada para a interface do usuário!
io.to(`auction_${data.auctionId}`).emit('auctioneerMessage', {
  message: aiMessage,
  timestamp: new Date()
});
```
O Frontend pega o evento `auctioneerMessage` e renderiza no chat com estilo diferenciado (`🎙️ Leiloeiro (IA)`).

### B. Resiliência: Timeout e Circuit-Breaker (Fallback)
Em eventos de alta volumetria global ou picos de demanda na LLM (`503 Service Unavailable`), chamadas de rede para a API externa (Google) podem travar (hanging) indefinidamente, bloqueando completamente a fila do BullMQ (efeito cascata / *starvation*).
Para blindar nossa arquitetura, implementamos um Timeout Estrito usando `Promise.race()`:
```typescript
// A paciência é zero: Tolerância máxima de 2.5 segundos para a IA responder!
const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT_API')), 2500)
);

const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise
]);
```
Se a API falhar ou demorar milissegundos a mais do que o permitido, a promessa é abortada e o sistema ejeta um **Fallback randômico local** (`"Incrível! [Nome] jogou duro com R$ [Valor]! Alguém tem coragem de cobrir?"`). O show de leilão não para e a usabilidade nunca é penalizada.

---

## 5. Criação de Leilões com Visão Computacional (AI Listing)

Para reduzir a fricção na entrada de novos lotes e aumentar a qualidade dos anúncios, adicionamos um gerador de *Copywriting* baseado na análise nativa da imagem da peça de luxo.

### Separação de Cargas (HTTP Síncrono vs Redis)
Diferente do Leiloeiro (que roda no background do Redis/BullMQ para não travar os lances), a geração do anúncio acontece enquanto o usuário ativamente aguarda a construção do formulário. Por estarem em contextos arquiteturais diferentes, optamos pela comunicação **HTTP Síncrona direta**:

1. **Frontend (Upload e Base64):** Na rota `/create`, o usuário anexa a foto da peça. A imagem é serializada em Base64 pelo próprio browser e enviada para a rota `POST /api/ai/analyze-image`.
2. **Backend (Visão Computacional):** O controller aciona o modelo multimodal do Gemini. O modelo recebe uma instrução de especialista e devolve um JSON estrito contendo Título, História de Vendas (Copywriting) e uma Sugestão de Preço Inicial coerente com a peça visualizada.
3. **Autopreenchimento:** O servidor devolve o payload para o Frontend preencher magicamente os inputs do formulário de criação.
4. **Persistência Real:** Ao aprovar o anúncio, a imagem Base64 é finalmente disparada para o `POST /api/auctions` e atrelada oficialmente à coluna `imageUrl` do banco de dados relacional NeonDB, sendo renderizada de forma dinâmica por todo o ecossistema.

Essa estratégia arquitetural garante que a funcionalidade pesada de "Criação de Anúncios" **não divida a mesma fila** da funcionalidade crítica de "Lances Ao Vivo", mantendo o sistema modular, rápido e 100% blindado contra concorrência impura.
