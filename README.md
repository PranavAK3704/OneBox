OneBox — AI-Powered Email Aggregator

A feature-rich email onebox built using Node.js, TypeScript, IMAP, Elasticsearch, Groq AI, Qdrant, and Next.js.
Implements all assignment requirements including real-time sync, AI categorization, Slack/webhooks, frontend UI, and RAG-based suggested replies.

Features Completed
1. Real-Time IMAP Email Synchronization

Persistent IMAP (IDLE mode) without cron jobs.

Fetches last 30 days of emails on startup.

Detects new incoming emails instantly.

Multi-account ready (Account 1 + optional Account 2).

2. Searchable Storage Using Elasticsearch

Emails indexed into local Elasticsearch via Docker.

Full-text search (subject, body, from, to).

Filters supported: account, folder, category.

Efficient queries for large inboxes.

3. AI-Based Email Categorization (Groq Llama 3.1)

Categories implemented:

Interested

Meeting Booked

Not Interested

Spam

Out of Office

Optimized AI usage:

New emails (< 24 hours) use Groq AI.

Older emails use a local keyword classifier.

Automatic fallback on rate limits or errors.

4. Slack and Webhook Automation

For emails categorized as “Interested”:

Sends Slack notifications.

Triggers webhook events (webhook.site or custom URLs).

Graceful retry + rate-limit protection.

5. Full Frontend Dashboard (Next.js 15)

Real-time inbox dashboard.

Full-text search bar powered by Elasticsearch.

Filters: category, account, folder.

Stats cards summarizing categories.

Email list + detail view.

Client-only hydration-safe components.

Custom CSS UI.

6. RAG-Based Suggested Replies (Final Interview Requirement)

Retrieval-Augmented Generation fully implemented.

Product/outreach context stored in Qdrant vector DB.

Simple custom embedding generator (no external API required).

Backend retrieves relevant context and generates replies with Groq Llama 3.1.

Frontend Suggested Reply panel with:

generate

regenerate

copy

This completes the full intelligent reply workflow end-to-end.

Architecture Overview
                       ┌──────────────────────────────┐
                       │          Frontend             │
                       │          Next.js UI           │
                       │ - Search / Filters            │
                       │ - Email Detail                │
                       │ - Suggested Replies           │
                       └───────────────┬──────────────┘
                                       │
                                       ▼
                       ┌──────────────────────────────┐
                       │            Backend            │
                       │        Node.js + TypeScript   │
                       │ - /api/emails                 │
                       │ - /api/emails/search          │
                       │ - /api/reply (RAG)            │
                       └───────┬───────────┬─────────┘
                               │           │
                     IMAP Sync │           │ RAG Engine
                               │           ▼
         ┌─────────────────────┘    ┌────────────────────┐
         │ IMAP Worker               │ Qdrant Vector DB    │
         │ - IDLE mode               │ - Context storage   │
         │ - Real-time updates       │ - Semantic search   │
         └───────┬──────────────────┘
                 │
                 ▼
     ┌──────────────────────────┐
     │  Elasticsearch Index     │
     │  Full-text email search  │
     └──────────────────────────┘
                 ▼
     ┌──────────────────────────┐
     │   Groq AI Classifier     │
     │   Llama 3.1 (8B)         │
     └──────────────────────────┘
                 ▼
     ┌──────────────────────────┐
     │   Slack + Webhooks       │
     └──────────────────────────┘

Setup Instructions
1. Clone the Repository
git clone https://github.com/PranavAK3704/OneBox
cd OneBox

2. Start Docker Services (Elasticsearch + Qdrant)
cd docker
docker-compose up -d

3. Configure Environment Variables

In backend/.env, set:

IMAP credentials

Slack webhook URL

Groq API key

Elasticsearch URL

Qdrant URL

4. Start Backend
cd backend
npm install
npm run dev


Backend will run on:

http://localhost:3000

5. Start Frontend
cd frontend
npm install
npm run dev


Frontend will run on:

http://localhost:3001

API Endpoints
GET /api/emails

Returns list of emails with optional filters.

GET /api/emails/search?q=

Full-text search through Elasticsearch.

POST /api/reply

Generates RAG-based suggested reply.

GET /api/health

Health check endpoint.

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

Replace this with your Loom link:

https://www.loom.com/share/cd47d55a424b4ff3a7c2963694f13676

Final Notes

All six required features are fully implemented, including the advanced RAG-based suggested reply system. The system is optimized to handle large inboxes, avoid rate limits, and provide a complete end-to-end onebox experience.
