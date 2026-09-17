# Tasks: Auth & Dashboard

## Phase 1: Authentication & Seeding (Backend)
- [x] **Task 1.1:** Criar script `prisma/seed.ts` para popular o banco com 3 usuários reais e 3 leilões variados.
- [x] **Task 1.2:** Criar `authController.ts` e `authRoutes.ts` (Endpoints de Login e Registro).
- [x] **Task 1.3:** Remover hacks de auto-criação do `auctionController.ts` para restabelecer a segurança relacional do banco.

## Phase 2: Navigation (Frontend)
- [x] **Task 2.1:** Desenvolver tela de Login e Registro (`/login`).
- [x] **Task 2.2:** Desenvolver Dashboard de Leilões (`/`) consumindo a API de listagem.
- [x] **Task 2.3:** Mover a Sala de Leilão para uma rota dinâmica (`/auction/[id]/page.tsx`).
- [x] **Task 2.4:** Amarrar os lances ao ID e Nome do usuário via LocalStorage.
