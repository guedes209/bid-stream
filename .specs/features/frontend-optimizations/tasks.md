# Tasks: Frontend Optimizations

## Phase 1: Live Room UX & Bugfixes
- [x] **Task 1.1: Fix Socket Duplication**
  - Refatorar o `useEffect` do Socket.io no `auction/[id]/page.tsx` para remover os *listeners* corretamente (`socket.off`) no *cleanup function*, impedindo que mensagens cheguem em dobro no feed devido ao React Strict Mode.
- [x] **Task 1.2: Inline Error Handling**
  - Refatorar a variável de estado `error` para separar erros de conexão/carregamento (`fatalError`) de erros de validação de lances (`bidError`).
  - Renderizar o `bidError` no painel de lances, mantendo a tela do leilão visível e interativa.

## Phase 2: Auction History & Strict Deduplication
- [x] **Task 2.1: Backend History Injection**
  - Alterar o `auctionController.ts` (`getAuctions`) para incluir a tabela `bids` com o `bidder` embutido.
- [x] **Task 2.2: Frontend History Hydration**
  - No `fetchAuctionData` do Frontend, iterar sobre `currentAuction.bids` para popular os `events` do chat de forma retroativa.
  - Reconstruir o `chartData` mapeando os lances históricos para montar a curva de preço correta ao entrar.
- [x] **Task 2.3: Strict Array Deduplication**
  - Impedir definitivamente a duplicação bloqueando as funções de estado do React (`setEvents`) de processarem um `payload.bid.id` que já exista no array.

## Phase 3: Activity Feed UX (Top-Down & Capping)
- [x] **Task 3.1: Invert Feed Order**
  - Alterar a renderização do array `events` para inserir novos lances no topo (`[new, ...prev]`).
  - Remover a lógica de scroll automático (`chatEndRef`).
- [x] **Task 3.2: Array Size Capping (Memory Leak Prevention)**
  - Limitar o array de eventos para armazenar apenas as últimas 50 mensagens usando `.slice(0, 50)`.
  - Fixar a altura da caixa do chat na interface.
