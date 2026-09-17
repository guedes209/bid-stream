# Tasks: Create Auction (AI-Powered)

## Phase 1: Backend AI Endpoint
- [x] **Task 1.1: Expose Vision Route**
  - Implementar a rota `POST /api/ai/analyze-image` no arquivo `aiRoutes.ts`.
  - A rota deve receber uma imagem em `base64` e chamar o método síncrono `generateListingInfo` do `aiService.ts`.
  - Retornar o JSON parseado contendo `title`, `description` e `startingPrice`.

## Phase 2: Frontend UI & Layout
- [x] **Task 2.1: Create Page Component**
  - Criar `frontend/src/app/create/page.tsx` seguindo o design Minimalista/Luxo.
  - Implementar um formulário controlado contendo: Input de Imagem, Título, Descrição, Preço Inicial e Data de Término.
- [x] **Task 2.2: AI Generation Flow**
  - Adicionar o estado de "Analisando Imagem..." (loading spinner).
  - Ligar o upload da imagem ao endpoint do backend, preenchendo o formulário dinamicamente com o retorno do Gemini.

## Phase 3: Final Submission
- [x] **Task 3.1: Form Integration**
  - Ligar o botão de "Criar Leilão" ao endpoint `POST /api/auctions`.
  - Tratar redirecionamento pós-sucesso para a raiz (`/`).

