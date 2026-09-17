# Arquitetura do Sistema: BidStream

Este diagrama detalha o fluxo de dados e os componentes do sistema.

```mermaid
flowchart TD
    %% Componentes
    Client[Next.js Frontend]
    API[Node.js API Server]
    Socket[Socket.io Server]
    Worker[Node.js Background Worker]
    
    %% Bancos e APIs
    DB[(Neon PostgreSQL)]
    Redis[(Upstash Redis & BullMQ)]
    Gemini[Gemini API - Vision & LLM]

    %% Fluxos do Cliente
    Client <-->|REST - Cadastros| API
    Client <-->|WebSockets - Lances| Socket

    %% Integrações Backend
    API <-->|Prisma ORM| DB
    API -->|Envia Tarefas| Redis
    Socket <-->|Pub/Sub Eventos| Redis

    %% Worker (Processos em Background)
    Worker <-->|Consome Fila| Redis
    Worker <-->|Atualiza BD| DB
    Worker <-->|Gera Textos e Preços| Gemini
    
    %% Nota de arquitetura
    classDef cloud fill:#f9f,stroke:#333,stroke-width:2px;
    class DB,Redis,Gemini cloud;
```

### Explicação do Fluxo de IA (Background Worker)
Para garantir que o WebSocket nunca fique travado, as chamadas para a API do **Gemini** são enfileiradas no Redis (BullMQ). O Node.js Worker consome essa fila em background, faz a requisição à IA, salva no PostgreSQL (Neon) e dispara um evento via Redis para o Socket.io notificar os clientes na tela.

