# Specification: Auth & Dashboard (User Journey)

## 1. Description
The system requires a realistic user journey to replace the temporary mock-user logic. Users must be able to register, login, view a dashboard of available live auctions, and enter a specific auction room. The database must be seeded with initial data to facilitate testing.

## 2. EARS Requirements
- **WHEN** the application starts, **IF** the database is empty, **THEN** the system shall provide a Prisma Seed script to populate users and varied auctions.
- **WHEN** an unauthenticated user visits the platform, **THEN** they shall be redirected to the Login/Register screen.
- **WHEN** a user registers, **THEN** their credentials shall be securely saved in the `User` table.
- **WHEN** a user successfully logs in, **THEN** they shall be redirected to the Dashboard.
- **WHEN** a user is on the Dashboard, **THEN** the system shall display a list/grid of all active auctions.
- **WHEN** a user clicks on an auction card, **THEN** the system shall route them to the dynamic Live Auction room (`/auction/[id]`).
- **WHEN** a user creates an auction or places a bid, **THEN** the system must strictly use their authenticated User ID (rejecting the action if the user does not exist in the database).

