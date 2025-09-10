# A2A B2B – Frontend (Prototype)

This repository contains a Next.js application (App Router) for a B2B assistant. It provides a modern UI and a set of API routes that integrate with OpenAI and, optionally, Supabase.

Important: This is a prototype. Interfaces, endpoints, and data models are evolving and may change without notice.

## Features

- Chat with AI: Server route to process messages using OpenAI when a conversation id is provided; local echo fallback otherwise.
- Conversations: Local storage conversation management with a demo conversation bootstrap endpoint.
- Vendors and products: API routes for vendor catalog upload/seed/search and product search/meta.
- Pre-orders and missions: API routes to create and manage pre-orders and missions.
- Org and vendors: Organization/vendor management routes (including approve/remove vendor endpoints).
- Semantic search and embeddings: Routes for semantic search and vector embeddings reindex.
- UI components: shadcn/ui-based components with Tailwind CSS and lucide-react icons.

## Tech Stack

- Next.js 15, React 19, TypeScript 5
- Tailwind CSS 4, shadcn/ui, lucide-react
- Supabase JS client (optional)
- pgvector (via Supabase migrations in `supabase/migrations`)

## Requirements

- Node.js 18+
- npm
- (Optional) Supabase project if you plan to use DB-backed features

## Getting Started

1. Clone and install
   ```bash
   git clone <your-repo-url>
   cd A2A-B2B
   npm ci
   ```

2. Environment variables
   ```bash
   cp env.example .env.local
   # Fill the values in .env.local
   ```

3. Run the dev server
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

## Scripts

- dev: Start Next.js dev server at port 3000
- build: Create a production build
- start: Run the production server
- lint: Run Next.js ESLint

## Environment Variables

Defined in `env.example`:

- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL (client-side)
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anon key (client-side)
- SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-side only)
- OPENAI_API_KEY: OpenAI API key used by server routes
- (Optional) N8N_WEBHOOK_URL: placeholder for potential future integrations

Note: `src/lib/supabaseClient.ts` and `src/lib/supabaseAdmin.ts` read the Supabase variables. If they are missing, the app will log a warning. This is expected in environments where Supabase is not configured yet.

## API Routes (overview)

Server endpoints are implemented under `src/app/api/`:

- Agents: `api/agents`
- Auth: `api/auth/register`
- Conversations: `api/conversations` (includes `demo`, `[id]/messages`, `start`)
- MCP: `api/mcp/respond`, `api/mcp/mission`
- Missions: `api/missions`, `api/missions/[id]`
- Org: `api/org`, `api/org/vendors`, `api/org/vendors/approve`, `api/org/vendors/remove`
- Pre-orders: `api/pre-orders`, `api/pre-orders/[id]`
- Products: `api/products`, `api/products/search`, `api/products/meta`
- Search: `api/search/semantic`
- Stats: `api/stats`
- Supabase: `api/supabase/health`, `api/supabase/seed`
- Vendor: `api/vendor`, `api/vendor/catalog/upload`, `api/vendor/products`, `api/vendor/products/seed`, `api/vendor/search`
- Embeddings: `api/embeddings/reindex`

Not all endpoints may be fully implemented; some return mock/demo data as part of the prototype.

## Project Structure (high-level)

```
src/
├── app/
│   ├── api/                 # Server routes (see list above)
│   └── ...                  # App router pages
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── Layout.tsx, Sidebar.tsx, Modals, etc.
├── services/                # Frontend service helpers (API, conversations)
├── lib/                     # Utilities (Supabase clients, helpers)
├── types/                   # Shared TypeScript types
supabase/
└── migrations/              # SQL migrations (pgvector, missions, base)
```

## How It Works (brief)

- Chat flow: `src/services/api.ts` sends messages to `/api/mcp/respond` when a `conversation_id` exists; otherwise it echoes locally. Conversations are stored locally via `src/services/conversationService.ts`, with a server demo bootstrap at `/api/conversations/demo`.
- Supabase: optional. When configured, server routes can persist data and use pgvector embeddings.

## Configuration Notes

- `next.config.ts` sets `ignoreDuringBuilds` for ESLint and TypeScript to allow rapid iteration during prototyping. Tighten these for production.

## Deploy

Vercel is recommended. Set the environment variables above in your Vercel project. Because this is a prototype, ensure you review routes and env usage before exposing publicly.

## Troubleshooting

- next: command not found → run `npm ci` to install dependencies.
- Supabase env warnings → set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- OpenAI key issues → set `OPENAI_API_KEY` in `.env.local` and restart.

## Contributing

Pull requests are welcome. Please keep in mind this is a prototype; APIs and UI are in flux.
