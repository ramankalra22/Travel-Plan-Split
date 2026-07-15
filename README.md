# Travel Itinerary Planner with Splitwise Feature

A complete, full-stack travel planner and expense splitter built with **Next.js 16 (App Router)**, **Supabase PostgreSQL**, **NextAuth**, and **OpenAI GPT-4o-mini**.

This application allows groups of travelers to plan itineraries, add destinations and activities, log expenses, and automatically calculate the minimum number of transactions needed to settle up (using a Splitwise-style greedy balance simplification algorithm).

---

## 🚀 Key Features

*   **Next.js 16 App Router**: Rich, animated, responsive UI with glassmorphic cards, custom layouts, and loaders.
*   **NextAuth Authentication**: Email-based credential authentication with role support (`user` and `admin`).
*   **Supabase Postgres Backend**: Uses the raw `pg` Node driver with parameterized queries (no ORM) for extreme performance, security, and type safety.
*   **Advanced Splitwise Engine**: Supports **Equal**, **Exact**, and **Percentage** splits across custom trip members (who do not need to be registered users).
*   **Interactive AI Travel Assistant**: AI agent that suggests itineraries, budget tips, local food options, and splitting advice based on trip context.

---

## 🛠️ Tech Stack & Requirements

*   **Framework**: Next.js 16 + React 19
*   **Styling**: TailwindCSS (v4 CSS-first system)
*   **Database**: Supabase PostgreSQL (Managed Relational DB)
*   **Database Driver**: `pg` (Node Postgres Client)
*   **Authentication**: NextAuth.js (Credentials Provider)
*   **AI Engine**: OpenAI NodeJS SDK (`gpt-4o-mini`)

---

## 📂 Project Structure

```
travel-planner/
├── migrations/
│   └── init.sql           # Database schema migrations
├── scripts/
│   └── init-db.js         # Script to initialize database tables locally
├── src/
│   ├── app/
│   │   ├── layout.js      # Global layout & SEO metadata
│   │   ├── page.js        # Dashboard (upcoming/completed trips, stats)
│   │   ├── login/         # Sign-in page
│   │   ├── register/      # Sign-up page
│   │   ├── profile/       # Profile management page
│   │   ├── trips/
│   │   │   ├── page.js    # My Trips view (search & filter tabs)
│   │   │   ├── new/       # New trip creation form
│   │   │   └── [id]/      # Detailed trip view (Itinerary, Expenses, Balances, AI Chat)
│   │   └── api/
│   │       ├── auth/      # Registration & NextAuth API handlers
│   │       ├── trips/     # Trips CRUD endpoints
│   │       ├── destinations/ # Destinations API
│   │       ├── activities/   # Activities API
│   │       ├── expenses/     # Expenses & splits management
│   │       ├── expense-balances/ # Splitwise calculation engine
│   │       ├── profile/   # Profile update endpoint
│   │       └── ai/        # OpenAI suggest endpoint
│   ├── components/
│   │   ├── Navbar.js      # Global glassmorphism navigation
│   │   ├── TripCard.js    # Interactive trip preview card
│   │   ├── ExpenseForm.js # Complex form with 3 split modes
│   │   ├── BalanceView.js # Net balance sheets & suggested settlements
│   │   └── AIAssistant.js # Context-aware OpenAI chat interface
│   └── lib/
│       ├── db.js          # Serverless-optimized pg pool configuration
│       └── auth.js        # NextAuth options configuration
├── .env.example
├── package.json
└── requirements.txt       # List of npm packages
```

---

## 🗄️ Database Setup & Supabase Migration

You have **two options** to configure your database:

### Option A: Use Supabase SQL Editor (Recommended)
1. Log in to the [Supabase Dashboard](https://supabase.com/).
2. Create a new project.
3. Click on the **SQL Editor** tab in the left sidebar.
4. Copy the entire content of [init.sql](file:///c:/Users/Admin/Desktop/travel%20planner/travel-planner/migrations/init.sql).
5. Paste it into the editor and click **Run**.
6. Verify that the tables (`users`, `trips`, `trip_members`, `destinations`, `activities`, `expenses`, `expense_participants`) are created successfully.

### Option B: Run Migration Script Locally
1. In the Supabase project dashboard, navigate to **Project Settings** -> **Database**.
2. Copy the **Connection string** (URI format) under **Connection Info**. Make sure to replace `[YOUR-PASSWORD]` with your actual database password.
3. Create a `.env.local` file in the root of your project:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
   ```
4. Run the initialization script:
   ```bash
   npm run db:init
   ```

---

## 🔌 Connection Pooling & Serverless Considerations

Since Next.js API Routes run in a serverless environment, database connections can easily saturate if a new connection is spawned on every request. 

We address this in [db.js](file:///c:/Users/Admin/Desktop/travel%20planner/travel-planner/src/lib/db.js) by:
1. Reusing a single `pg.Pool` instance across serverless execution contexts.
2. Setting `max: 10` connections to prevent scaling spikes from locking the database.
3. Specifying a low `idleTimeoutMillis: 30000` (30 seconds) to proactively close unused connections.
4. Supplying a `connectionTimeoutMillis: 10000` (10 seconds) to fail-fast if Supabase connection limits are hit.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the variables:
*   `DATABASE_URL`: Your Supabase transaction pooler or direct connection URI.
*   `NEXTAUTH_SECRET`: A long random string (you can generate one with `openssl rand -base64 32`).
*   `NEXTAUTH_URL`: `http://localhost:3000` (local development) or your Vercel deployment URL.
*   `OPENAI_API_KEY`: Your OpenAI API key starting with `sk-...`.

---

## 🚀 Running the App Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up database tables (if not done yet):
   ```bash
   npm run db:init
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Vercel Deployment Steps

1. Push your code repository to GitHub/GitLab.
2. Connect your repository to [Vercel](https://vercel.com).
3. Under **Environment Variables**, add the following keys:
   *   `DATABASE_URL` (Use Supabase connection URI)
   *   `NEXTAUTH_SECRET` (Your random secret string)
   *   `NEXTAUTH_URL` (Set to your Vercel production URL, e.g. `https://travel-split.vercel.app`)
   *   `OPENAI_API_KEY` (Your OpenAI API key)
4. Click **Deploy**. Vercel will automatically build and publish the production package.
