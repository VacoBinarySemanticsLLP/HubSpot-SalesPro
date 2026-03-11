# HubSpot Investigation POC - Work Summary

## Overview

The **HubSpot Investigation POC** is a specialized Proof-of-Concept designed to streamline the sales investigation workflow by integrating HubSpot CRM with a localized, efficient dashboard. It automates the process of identifying, tracking, and updating tickets that require deep-dive investigations.

---

## Technical Architecture

The project follows a modern decoupled architecture, ensuring scalability and ease of deployment:

### 1. Backend (FastAPI)
- **Framework**: FastAPI (Python) for high-performance asynchronous API endpoints.
- **Authentication**: Full OAuth 2.0 implementation for secure HubSpot application connection.
- **Database**: SQLite for local persistence of investigation data and OAuth tokens.
- **Key Modules**:
  - `main.py`: Core application logic, OAuth routes, and synchronization logic.
  - `database.py`: SQLAlchemy ORM models for Tickets and Tokens.

### 2. Frontend (Next.js)
- **Framework**: Next.js (React) providing a responsive and dynamic user experience.
- **Key Features**:
  - Real-time investigation queue display.
  - Advanced search and pagination.
  - Interactive status management and comment syncing.

### 3. Deployment & Infrastructure
- **Containerization**: Fully Dockerized using `docker-compose` for local and cloud environments.
- **Cloud Hosting**: Optimized for deployment on **Google Cloud Platform (GCP)** via Compute Engine VMs.

---

## Core Features & Functionality

### 🔄 Multi-Channel Ticket Sync
The system supports three primary methods for populating the investigation queue:
1. **On-Demand Sync**: A manual "Sync Tickets" button in the UI for immediate updates.
2. **Automated Webhooks**: Real-time ticket ingestion via HubSpot Webhook subscriptions.
3. **CLI Sync**: Dedicated POST endpoints for programmatic or scheduled synchronization.

### 📊 Comprehensive Dashboard
- **Live Search**: Instant lookup by Ticket ID or Merchant Name.
- **Visual Status Tracking**: Color-coded badges for quick identification of investigation states (Open, In Progress, Resolved).
- **Metadata Visibility**: Rich ticket details including merchant info, reason, and timestamps.

### 🤝 Bidirectional Communication
- **Status Syncing**: Changing a status in the dashboard automatically maps to the correct HubSpot pipeline stage.
- **Comment Persistence**: Internal investigation comments are synced back to HubSpot, ensuring the system of record is always up to date.

---

## Business Value

- **Efficiency**: Reduces time spent manually searching for tickets in the HubSpot UI.
- **Centralization**: Provides a single pane of glass for all sales-related investigation work.
- **Reliability**: local SQLite storage with Docker volume persistence ensures data safety even across system restarts.
