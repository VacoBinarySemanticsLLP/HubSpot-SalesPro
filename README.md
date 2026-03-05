# SmashOps.pro - Repair Operations Dashboard

A secure, real-time equipment escalation queue that bi-directionally syncs with HubSpot CRM to manage and resolve repair tasks.

## 📖 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [🛠️ Complete Setup Guide](#️-complete-setup-guide)
- [📂 Project Structure](#-project-structure)
- [🚨 Common Issues](#-common-issues)
- [🔑 Environment Variables](#-environment-variables)
- [Contributing](#contributing)

---

## Overview

SmashOps.pro is an internal technician dashboard built for speed and reliability. It displays equipment repair tickets pulled from HubSpot CRM, enriches them with custom data, and presents them in an optimistic, filterable UI. When a technician resolves a ticket locally, the system uses a resilient State Machine to update the CRM, handling network failures gracefully without losing data.

## Key Features

- **HubSpot Integration** — Syncs with HubSpot CRM tickets via API; incoming webhooks are cryptographically verified using HMAC SHA-256 signatures.
- **Resilient Sync Engine** — Utilizes Next.js Server Actions with a `PENDING`, `SYNCED`, and `FAILED` state machine.
- **Optimistic UI** — Built with React Hot Toast and Tailwind CSS 4 for immediate visual feedback before database transactions complete.
- **Actionable Queue** — Displays only open repair tasks in a clean, filterable table.
- **Enterprise Security** — Protected by NextAuth.js credentials, ensuring only authorized technicians can access the queue or trigger server mutations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16.1](https://nextjs.org/) (App Router) |
| Authentication | [NextAuth.js v4](https://next-auth.js.org/) |
| Database | SQLite via [Prisma ORM](https://www.prisma.io/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| API | [HubSpot CRM API v3](https://developers.hubspot.com/) |

---

## 🛠️ Complete Setup Guide

Follow these steps exactly to get a local development environment running.

### Prerequisites

- **Node.js** v18+ (LTS recommended)
- **npm** (comes with Node.js)
- **Ngrok** (for local webhook testing)
- A **HubSpot** sandbox or developer account.

### Step 1: HubSpot CRM Setup

To make the data sync perfectly, you must create these specific **Ticket Properties** in your HubSpot account.
*Go to HubSpot Settings > Properties > Select "Ticket properties" > Create property.*

Make sure the **Internal Name** matches exactly:

* `equipment_issue` (Dropdown: Broken String, Shattered Frame, Tension Loss, etc.)
* `string_tension` (Single-line text)
* `warranty_status` (Dropdown: Active, Expired, Void)
* `required_parts` (Multiple checkboxes: Strings, Overgrip, Grommets, etc.)
* `target_completion_date` (Date picker)

### Step 2: Local Installation

Clone the repository and install the dependencies.

```bash
git clone -b feature/new-upgrade https://github.com/VacoBinarySemanticsLLP/HubSpot-SalesPro.git
cd HubSpot-SalesPro
npm install
```

### Step 3: Environment Variables

Create your local environment file:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials (see [Environment Variables](#-environment-variables) for details).

### Step 4: Database Initialization

Generate the Prisma client and push the schema to create your local SQLite database:

```bash
npx prisma generate
npx prisma db push
```

### Step 5: Start the App & Ngrok Tunnel

You need three terminal tabs open to run the full architecture.

**Tab 1: The Next.js Server**
```bash
npm run dev
```

**Tab 2: Prisma Studio (Database Viewer)**
```bash
npx prisma studio
```

**Tab 3: Ngrok (Secure Tunnel for Webhooks)**
```bash
ngrok http 3000
```

### Step 6: Configure Webhooks

1. Copy the `https://....ngrok-free.app` URL from your Ngrok terminal.
2. Go to your HubSpot Private App > **Webhooks**.
3. Set the Target URL to: `https://your-ngrok-url.ngrok-free.app/api/webhook`
4. Subscribe the webhook to the following Ticket events:
   - `equipment_issue`
   - `Ticket pipeline and stage` (Internal name: `hs_pipeline_stage`)

---

## 📂 Project Structure

```text
badminton-tracker/
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                  # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # NextAuth.js API routes
│   │   │   └── webhook/     # HubSpot Webhook handler
│   │   ├── auth/            # Auth-related pages
│   │   ├── actions.js       # Server Actions for CRM sync
│   │   ├── layout.js        # Root layout
│   │   └── page.js          # Main dashboard page
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Shared utilities (Prisma client, etc.)
│   └── services/            # Business logic / CRM services
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| `Table does not exist` error | Run `npx prisma db push` to create tables. |
| Prisma client errors | Run `npx prisma generate` to regenerate the client. |
| HubSpot API/Webhook fails | Verify `HUBSPOT_ACCESS_TOKEN` and ensure Ngrok URL is updated in HubSpot. |
| Port 3000 is in use | Force kill the process: `fuser -k 3000/tcp` or `lsof -ti:3000 | xargs kill -9`. |
| Database Corruption | Run `rm prisma/dev.db && npx prisma db push` for a hard reset. |

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite connection string (default: `file:./dev.db`) | Yes |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App token with `tickets` scope | Yes |
| `HUBSPOT_WEBHOOK_SECRET` | Secret from HubSpot Webhooks tab for verification | Yes |
| `HUBSPOT_CLOSED_STAGE_ID` | Internal ID of the "Closed" pipeline stage | Yes |
| `NEXTAUTH_SECRET` | Random string for session encryption | Yes |
| `NEXTAUTH_URL` | Application URL (e.g., `http://localhost:3000`) | Yes |
| `TECH_PASS` | Password for local technician login | Yes |

---

## Contributing

1. Create a branch: `git checkout -b feature/your-feature-name`
2. Make your changes and test locally.
3. Commit with a descriptive message: `git commit -m "feat: updated sync logic"`
4. Push and open a Pull Request.