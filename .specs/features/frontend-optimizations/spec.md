# Specification: Frontend Optimizations

## 1. Description
This feature addresses critical UX bugs in the Live Auction Room. Currently, WebSocket events are being duplicated in the Activity Feed, and validation errors are destructively removing the user from the live auction interface. Phase 2 introduces full Historical Bids loading so users entering late can see all prior activity.

## 2. EARS Requirements
- **WHEN** a user is connected to the Live Auction Room, **THEN** WebSocket listeners (`socket.on`) must be strictly bound to prevent duplicate event triggering (handling React Strict Mode remounts).
- **WHEN** a user receives a new bid payload, **THEN** it must be rendered exactly once in the Activity Feed.
- **WHEN** a user submits an invalid bid (e.g., amount too low or auction closed), **THEN** the system shall display an inline error message near the bidding form.
- **WHEN** a bid validation error occurs, **THEN** the system must NOT navigate the user away from the live auction room nor obscure the charts and live feed.
- **WHEN** a user enters an auction room, **THEN** the system must load and display all historical bids and plot them on the price chart.
