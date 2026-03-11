# HubSpot Investigation & Repair Dashboard (SmashOps.pro)

## 📋 Project Overview

The **HubSpot Investigation & Repair Dashboard** (codenamed **SmashOps.pro**) is an enterprise-grade Proof-of-Concept designed to bridge the gap between HubSpot CRM and specialized field operations. It provides a secure, real-time environment for technicians and sales investigators to manage equipment escalations and ticket resolutions with bi-directional synchronization.

This system is optimized for speed, reliability, and data enrichment, transforming raw CRM data into an actionable, filterable queue.

---

## 🏗️ Technical Architecture & Stack

The architecture is built on a high-performance, decoupled stack designed for resilience and rapid feedback.

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16.1](https://nextjs.org/) | App Router architecture with [Tailwind CSS 4](https://tailwindcss.com/) and [React Hot Toast](https://react-hot-toast.com/). |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) / [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) | Hybrid approach using Python for heavy logic/OAuth and JS for optimistic UI updates. |
| **Database** | [SQLite](https://www.sqlite.org/) via [Prisma](https://www.prisma.io/) / [SQLAlchemy](https://www.sqlalchemy.org/) | Local storage with persistent Docker volumes for speed and offline-first reliability. |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) | Secure credentials-based access for technicians and sales teams. |
| **CRM API** | [HubSpot CRM API v3](https://developers.hubspot.com/) | Robust integration using OAuth 2.0 and Private App tokens. |

### System Architecture Diagram (Conceptual)
![Frontend Dashboard UI](UI.png)
*Figure 1: The Sales Investigation Dashboard featuring live search and status badges.*

---

## 🚀 Key Features

### 1. Resilient Sync Engine
Utilizes a custom State Machine to manage data consistency between the local DB and HubSpot.
- **States**: `PENDING`, `SYNCED`, `FAILED`.
- **Logic**: Handles network failures gracefully, ensuring no status update or comment is lost.

### 2. Smart Ticket Filtering & Lifecycle
- **Trigger**: The system only tracks tickets where `sales_investigation_required` is set to **"Yes"**.
- **Auto-Cleanup**: Records are automatically purged from the local dashboard if an investigation is flagged as no longer required in HubSpot.

### 3. Automated Data Enrichment
Each ticket pulled into the system is automatically enriched with:
- **Owner Details**: Full name and email of the ticket owner.
- **Company Metadata**: Name and city of the associated organization.
- **Contact Details**: Direct contact name and phone number.

### 4. SLA & Deadline Management
The system automatically calculates Service Level Agreement (SLA) deadlines based on the `investigation_reason`:
- **Documentation Support**: 72-hour resolution window.
- **Standard Cases**: 48-hour resolution window.

### 5. Enterprise Security
- **Webhook Verification**: Incoming HubSpot webhooks are cryptographically verified using **HMAC SHA-256 signatures**.
- **Access Control**: Role-based access via NextAuth.js to ensure only authorized personnel can trigger CRM mutations.

---

## 📊 Component Specifications

### Backend Endpoints
- `/install` / `/oauth-callback`: Handles the Public App OAuth handshake.
- `/sync-tickets`: Triggers a full reconciliation between HubSpot and SQLite.
- `/investigations/{id}/status`: Updates local state and maps it back to HubSpot pipeline stages.

### Frontend Interactions
- **Optimistic UI**: built-in feedback loops that update the UI immediately while the server action processes in the background.
- **Visual Status Badges**:
  - 🔵 **Blue**: Open
  - 🟠 **Amber**: In Progress
  - 🟢 **Green**: Resolved

---

## 🔗 Reference Links
- [HubSpot Developer Portal](https://developers.hubspot.com/)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

### Raw Data Preview
![Investigations JSON Payload](JsonResponse.png)
*Figure 2: Example JSON structure used for dashboard hydration.*
