# HubSpot Ticket Integration & Dashboard

A comprehensive system featuring a FastAPI backend and a Next.js frontend, designed to integrate with HubSpot webhooks for processing, enriching, and displaying ticket information.

## Features

- **Webhook Endpoint (FastAPI)**: Receives POST requests from HubSpot Ticket webhooks.
- **Smart Filtering**: Triggers only when the ticket property `sales_investigation_required` is "Yes". Automatically deletes records from the local database if an investigation is no longer required.
- **Data Enrichment**: Automatically fetches:
  - Owner details (Name, Email)
  - Associated Company details (Name, City)
  - Associated Contact details (Name, Phone)
- **SLA Deadline Calculation**: Automatically calculates SLA deadlines based on the `investigation_reason` (72 hours for "Documentation support", 48 hours for standard cases).
- **Database Storage**: Stores enriched ticket data securely in a local SQLite database (`hubspot_learning.db`).
- **Interactive Dashboard (Next.js)**: A frontend UI providing a cyber-industrial themed dashboard to view, search, and manage restaurant investigations.
- **Containerized Deployment**: Fully supported Docker & Docker Compose setup to run both backend and frontend environments effortlessly.

## Prerequisites

- **Docker and Docker Compose** (recommended for easiest setup)
- Python 3.11+ (if running the backend locally without Docker)
- Node.js 18+ (if running the frontend locally without Docker)
- [HubSpot Developer Account](https://developers.hubspot.com/) with a Private App Access Token.

## Setup via Docker (Recommended)

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Hubspot
    ```

2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token_here
    ```

3.  **Start the services**:
    ```bash
    docker-compose up --build
    ```
    - The **FastAPI backend** will be available at `http://localhost:8000`.
    - The **Next.js frontend** will be available at `http://localhost:3000`.

## Local Development (Without Docker)

### Backend

1.  **Navigate to the root directory**:
    ```bash
    cd Hubspot
    ```

2.  **Create and activate a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the FastAPI server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

### Frontend

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Next.js development server**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser.

## Webhook Testing (ngrok)

If testing HubSpot webhooks locally without Docker (FastAPI running on port 8000), use ngrok:
```bash
ngrok http 8000
```
Update your HubSpot webhook subscription with the generated ngrok URL, e.g., `https://<random-id>.ngrok-free.app/webhook`.

## Project Structure

- `main.py`: The entry point for the FastAPI backend application.
- `hubspot_client.py`: Handles interactions and enrichment calls to the HubSpot API.
- `database.py`: SQLAlchemy database models and configuration.
- `frontend/`: Next.js web dashboard application.
- `docker-compose.yml`: Docker services configuration for running the full stack.
- `Dockerfile` & `frontend/Dockerfile`: Image configurations for both FastAPI and Next.js apps respectively.
- `hubspot_learning.db`: Local SQLite database (Auto-generated).
