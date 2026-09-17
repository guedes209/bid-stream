# Modelagem do Banco de Dados (ERD)

```mermaid
erDiagram
    USER ||--o{ AUCTION : "creates (seller)"
    USER ||--o{ BID : "places (bidder)"
    AUCTION ||--o{ BID : "receives"

    USER {
        uuid id PK
        string name
        string email
        datetime created_at
    }

    AUCTION {
        uuid id PK
        uuid seller_id FK
        string title
        text description
        float starting_price
        float current_price
        datetime ends_at
        string status "ACTIVE, FINISHED"
        int version "Controle Concorrência"
    }

    BID {
        uuid id PK
        uuid auction_id FK
        uuid bidder_id FK
        float amount
        datetime created_at
    }
```

### Estratégia de Concorrência (Locking)
Para o sistema de leilão, usamos **Optimistic Locking** através da coluna `version` na tabela `AUCTION`. Sempre que um lance for recebido, o sistema verifica se a versão do leilão em memória bate com a versão do banco. Se não bater, o banco rejeita a transação (alguém deu lance no mesmo milissegundo).

