OneBox — AI-Powered Email Aggregator

A feature-rich email onebox built using Node.js, TypeScript, IMAP, Elasticsearch, Groq AI, Qdrant, and Next.js.
Implements all assignment requirements including real-time sync, AI categorization, Slack/webhooks, frontend UI, and RAG-based suggested replies.

Features Completed
1. Real-Time IMAP Email Synchronization

Persistent IMAP (IDLE mode) — no cron jobs.

Fetches last 30 days of emails on startup.

Detects new incoming emails instantly.

Multi-account ready (Account 1 + optional Account 2).

2. Searchable Storage Using Elasticsearch

Emails are indexed into a local Elasticsearch instance (via Docker).

Full-text search (subject, body, from, to).

Filters supported:

account

folder

category

Efficient querying for up to thousands of emails.

3. AI-Based Email Categorization (Groq Llama 3.1)

Categories implemented:

Interested

Meeting Booked

Not Interested

Spam

Out of Office

Optimized AI usage:

New emails (< 24 hours) use Groq AI.

Older emails use a local keyword classifier (prevents rate limiting).

Automatic fallback when Groq rate limits or fails.

4. Slack and Webhook Automation

When an email is classified as “Interested”:

Sends a Slack notification with sender + subject.

Triggers a webhook event (via webhook.site or custom URL).

Built-in rate-limit handling.

5. Frontend Dashboard (Next.js 15)

Fully implemented user interface:

Inbox view with email list and detail panel.

Full-text Elasticsearch search bar.

Filters for category, account, and folder.

Summary statistics cards.

Clean, responsive UI with custom CSS.

Hydration-safe components (all client side).

6. RAG-Based Suggested Replies (Final Interview Requirement)

Fully implemented Retrieval-Augmented Generation system.

Product/outreach context embedded and stored in Qdrant vector DB.

Simple embedding generator (no external API needed).

Backend RAG pipeline:

Retrieve relevant context from Qdrant

Build prompt

Call Groq Llama 3.1

Frontend:

“Generate Suggested Reply” button

Loading state

Reply textarea

Regenerate

Copy to clipboard

This completes the end-to-end intelligent reply system.

Architecture Overview
                       ┌──────────────────────────────┐
                       │          Frontend             │
                       │       Next.js Dashboard       │
                       │  - Search / Filters           │
                       │  - Email Detail View          │
                       │  - Suggested Replies UI       │
                       └───────────────┬──────────────┘
                                       │
            HTTP (REST API)             │
                                       ▼
                       ┌──────────────────────────────┐
                       │            Backend            │
                       │        Node.js + TS           │
                       │  /api/emails                 │
                       │  /api/emails/search          │
                       │  /api/reply (RAG)            │
                       └───────┬───────────┬─────────┘
                               │           │
                     IMAP Sync │           │ RAG Pipeline
                               │           ▼
         ┌─────────────────────┘    ┌────────────────────┐
         │ IMAP Worker               │ Qdrant Vector DB    │
         │ - IDLE mode               │ - Store context      │
         │ - New mail detection      │ - Semantic search    │
         └───────┬──────────────────┘
                 │
                 ▼
     ┌──────────────────────────┐
     │ Elasticsearch Index        │
     │ - Full-text search         │
     │ - Category/filters         │
     └───────────────────────────┘

                 ▼
     ┌──────────────────────────┐
     │ Groq AI Classifier        │
     │ - Llama 3.1 8B            │
     └───────────────────────────┘

                 ▼
     ┌──────────────────────────┐
     │ Slack + Webhooks          │
     │ - Interested notifications │
     └───────────────────────────┘

Setup Instructions
1. Clone the Repository
git clone https://github.com/PranavAK3704/OneBox
cd OneBox

2. Start Docker Services (Elasticsearch + Qdrant)
cd docker
docker-compose up -d

3. Configure Environment Variables

In backend/.env set:

IMAP credentials

Slack webhook URL

Groq API key

Elasticsearch URL

Qdrant URL

4. Start Backend
cd backend
npm install
npm run dev

5. Start Frontend
cd frontend
npm install
npm run dev


Frontend runs at:

http://localhost:3001


Backend runs at:

http://localhost:3000

API Endpoints
GET /api/emails

Returns filtered list of emails.

GET /api/emails/search?q=...

Full-text Elasticsearch search.

GET /api/health

Health check.

POST /api/reply

Generate suggested AI reply (RAG powered).

Project Structure
backend/
  src/
    imap-worker.ts
    ai-classifier.ts
    es-utils.ts
    rag-service.ts
    notifier.ts
    routes.ts
    server.ts

frontend/
  app/
    page.tsx
    layout.tsx
  components/
    EmailList.tsx
    EmailDetail.tsx
    StatsCards.tsx
    SuggestedReply.tsx
    FilterBar.tsx
    SearchBar.tsx
  styles/
docker/
  docker-compose.yml

Demo Video

(Replace this with your Loom link)

https://www.loom.com/share/cd47d55a424b4ff3a7c2963694f13676

Final Notes

This project implements all six required features including the advanced RAG system to qualify for final interview consideration.
The system is optimized to handle large inboxes, avoid rate limits, and provide a smooth end-to-end experience.
