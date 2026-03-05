# SmashOps.pro - Badminton Repair Dashboard

A real-time equipment escalation queue that syncs with HubSpot to manage and resolve repair tasks.

## Overview

This internal dashboard displays equipment repair tickets pulled from HubSpot CRM. Operators can view open issues and resolve them directly — when resolved, the app automatically updates the ticket status in both the local database and HubSpot.

## Key Features

- **HubSpot Integration** — Syncs with HubSpot CRM tickets via API.
- **Actionable Queue** — Displays only open repair tasks in a clean table.
- **One-Click Resolve** — Closing a ticket updates both the local DB and HubSpot simultaneously.
- **Modern UI** — Responsive design built with Tailwind CSS 4.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Database | SQLite via [Prisma ORM](https://www.prisma.io/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| API | [HubSpot CRM API](https://developers.hubspot.com/) |

## Getting Started

### Prerequisites

- **Node.js** v18+ (LTS recommended)
- **npm** (comes with Node.js)
- A **HubSpot Private App Access Token** with `tickets` read/write scope

> If you don't have a HubSpot token, ask the project admin.

## Step-by-Step Setup

## 1. Clone the repository
```bash
git clone https://github.com/VacoBinarySemanticsLLP/HubSpot-SalesPro.git
```
```bash
cd HubSpot-SalesPro
```
## 2. Install dependencies
```bash
npm install
```
## 3. Create your environment file from the template
```bash
cp .env.example .env
```
## 4. Open .env and fill in your credentials
```bash
# DATABASE_URL is pre-configured for SQLite, no change needed.

# Replace the placeholder with your actual HubSpot token:
HUBSPOT_ACCESS_TOKEN="pat-na2-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
## 5. Set up your local database (creates a dev.db file)
```bash
npx prisma db push
```
## 6. Generate the Prisma client
```bash
npx prisma generate
```
## 7. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the Repair Operations dashboard.

## Common Issues

| Problem | Solution |
|---------|----------|
| `Table does not exist` error | Run `npx prisma db push` to create tables |
| Prisma client errors after schema changes | Run `npx prisma generate` to regenerate |
| HubSpot API errors | Verify your `HUBSPOT_ACCESS_TOKEN` in `.env` is valid |

## Project Structure

```
HubSpot-SalesPro/
├── prisma/
│   └── schema.prisma       # Database schema (EquipmentTicket model)
├── public/                  # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── resolve/
│   │   │       └── route.js # POST endpoint — resolves a ticket
│   │   ├── layout.js        # Root layout
│   │   ├── page.js          # Main dashboard page (server component)
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   └── ResolveButton.js # Client component — resolve action button
│   └── lib/
│       └── prisma.js        # Prisma client singleton
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite connection string (default: `file:./dev.db`) | Yes |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App token with `tickets` scope | Yes |

## Contributing

1. **Create a branch** off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** and test locally.
3. **Commit** with a descriptive message:
   ```bash
   git add .
   git commit -m "feat: describe your change"
   ```
4. **Push** and open a Pull Request:
   ```bash
   git push origin feature/your-feature-name
   ```
