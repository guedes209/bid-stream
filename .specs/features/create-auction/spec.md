# Specification: Create Auction (AI-Powered)

## 1. Description
A new user-facing flow allowing authenticated sellers to create new auctions. To reduce friction, the system leverages Google Gemini Vision AI to automatically draft the auction's title, a persuasive description, and a suggested starting price strictly based on an uploaded photo of the item.

## 2. EARS Requirements

- **WHEN** a user navigates to the Create Auction page, **THEN** they must see an interface to upload an image.
- **WHEN** an image is uploaded, **THEN** the frontend must send the Base64 payload directly via HTTP to the AI analysis endpoint (bypassing Redis to avoid queue starvation).
- **WHEN** the AI successfully analyzes the image, **THEN** the system must auto-populate the Title, Description, and Starting Price form fields.
- **WHEN** the fields are auto-populated, **THEN** the user must be able to freely edit any of these values before submission.
- **WHEN** the user submits the final form, **THEN** the backend must create the Auction in the database and redirect the user to the Dashboard.

