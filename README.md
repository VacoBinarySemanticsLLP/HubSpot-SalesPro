# Hubspot Tracker - Repair Operations

A real-time equipment escalation queue designed to manage and resolve repair tasks synced directly from HubSpot.


##  Overview

This application serves as an internal dashboard for repair operations. It fetches equipment issues logged in HubSpot and presents them in a clean, actionable queue. When a task is "Resolved" in this dashboard, it automatically updates the corresponding ticket status in HubSpot and marks it as resolved in the local database.

##  Key Features

- **HubSpot Integration**: Real-time sync with HubSpot CRM tickets.
- **Actionable Queue**: Simplified view of active repair tasks.
- **Automated Workflows**: Resolving a task here triggers a ticket stage update in HubSpot.
- **Modern UI**: Built with a clean, responsive design using Tailwind CSS 4.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [Prisma](https://www.prisma.io/) with SQLite
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **API**: HubSpot CRM API

##  Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- A HubSpot Private App Access Token (with `tickets` scope)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VacoBinarySemanticsLLP/HubSpot-SalesPro.git
   cd badminton-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your `HUBSPOT_ACCESS_TOKEN`.

4. **Initialize the Database:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the result.

##  Project Structure

```text
badminton-tracker/
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── src/
│   ├── app/           # Next.js App Router (Pages & API)
│   ├── components/    # Reusable UI components
│   └── lib/           # Shared utilities (Prisma client singleton)
├── .env.example       # Template for environment variables
└── README.md          # Project documentation
```

##  Contributing

1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.
