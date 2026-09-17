# Tasks: Real-Time Auction System

## Phase 1: Specify (Concluído)
- [x] Definir requisitos core usando EARS.
- [x] Definir a feature de IA com o usuário (Smart Listing + Auctioneer Bot).
- [x] Fechar critérios de aceite.

## Phase 2: Design (Concluído)
- [x] Definir Stack Tecnológica (Next.js, Node.js, Neon PG, Upstash Redis, Gemini).
- [x] Modelagem de Banco de Dados (.specs/architecture/database.md).
- [x] Desenho da arquitetura (.specs/architecture/overview.md).

## Phase 3: Tasks Breakdown (Pronto para Execução)
- [x] **Task 3.1: Setup da Infraestrutura Base**
  - Inicializar projeto Node.js (Backend) com Express/TypeScript.
  - Inicializar Next.js (Frontend) com Tailwind.
  - Configurar Prisma ORM e conectar no Neon PostgreSQL.
- [x] **Task 3.2: API Core & "Smart Listing" (IA)**
  - Criar rotas CRUD de Leilões (Auctions).
  - Integrar Google Gemini API para rota de geração de anúncios baseado em imagem.
- [x] **Task 3.3: WebSockets & Filas (BullMQ)**
  - Subir servidor Socket.io.
  - Configurar BullMQ conectado no Upstash Redis.
- [x] **Task 3.4: Bidding Engine (Motor de Lances)**
  - Implementar lógica transacional do lance (Optimistic Locking).
  - Sincronizar emissão do novo lance via WebSocket.
- [x] **Task 3.5: "Auctioneer Bot" (IA em Background)**
  - Criar Worker que escuta novos lances, envia contexto pro Gemini e emite mensagens divertidas no chat.
- [x] **Task 3.6: Integração do Frontend UI**
  - Desenvolver a tela do leilão que reage aos WebSockets em tempo real.
  - Criar Chat/Feed de lances para as falas do Bot e dos usuários.

## Phase 4: Execute & Validate
- [ ] (Aguardando início da Task 3.1)
