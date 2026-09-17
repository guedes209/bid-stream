# Especificação: Real-Time Auction System (BidStream)

## 1. Visão Geral
Sistema de leilão em tempo real onde usuários podem cadastrar itens, dar lances concorrentes e acompanhar o cronômetro sincronizado via WebSockets. Inclui suporte nativo de IA para otimização de anúncios e engajamento.

## 2. Dicionário Ubíquo
*   **Auction (Leilão):** O evento de venda de um item com tempo determinado.
*   **Bid (Lance):** A oferta financeira feita por um usuário.
*   **Bidder (Licitante):** Usuário que está dando o lance.
*   **Locking:** Mecanismo de BD para evitar Race Conditions.
*   **Anti-Sniper:** Regra que adiciona tempo extra se um lance for feito no fim.
*   **Smart Listing:** Geração automática de detalhes do item via IA.
*   **Auctioneer Bot:** Agente de IA que interage no chat do leilão em tempo real.

## 3. Requisitos EARS

### 3.1. Lances e Concorrência
*   **Event-driven:** QUANDO um Bidder submete um Bid, O SISTEMA DEVE validar se o valor é maior que o Bid atual antes de registrá-lo.
*   **Unwanted behavior:** SE dois Bids chegarem no mesmo milissegundo, O SISTEMA DEVE processá-los de forma síncrona (usando Locking), aceitando o primeiro e rejeitando o segundo.
*   **State-driven:** ENQUANTO o leilão estiver "Finalizado", O SISTEMA DEVE rejeitar qualquer nova tentativa de Bid.

### 3.2. Sincronização em Tempo Real (WebSockets)
*   **Event-driven:** QUANDO um novo Bid for aceito, O SISTEMA DEVE emitir um evento via WebSocket para atualizar o valor na tela de todos os clientes em menos de 500ms.
*   **Unwanted behavior (Anti-Sniper):** SE um Bid for aceito nos últimos 30 segundos, O SISTEMA DEVE estender o cronômetro em mais 30 segundos.

### 3.3. Inteligência Artificial
*   **Event-driven (Smart Listing):** QUANDO um vendedor fizer o upload de uma imagem do produto, O SISTEMA DEVE usar um modelo de Visão/LLM para gerar e sugerir um Título, Descrição persuasiva e Preço Inicial.
*   **Event-driven (Auctioneer Bot):** QUANDO um novo Bid for aceito, O SISTEMA DEVE acionar o Auctioneer Bot em background para gerar uma mensagem contextual de engajamento (ex: "Belo lance de R$X!").
*   **Event-driven:** QUANDO o Auctioneer Bot gerar a mensagem, O SISTEMA DEVE transmiti-la no chat da sala via WebSockets.

## 4. Critérios de Aceite
1.  Testes de carga devem validar que N lances simultâneos não geram sobrescrita incorreta de Bids (integridade transacional).
2.  O gerador de "Smart Listing" deve processar a imagem e responder em até 5 segundos.
3.  Mensagens do "Auctioneer Bot" não podem bloquear a thread principal (o leilão não trava enquanto aguarda a IA formular a frase).
