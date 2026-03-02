# HubSpot Ticket Integration

A FastAPI-based application that integrates with HubSpot webhooks to process and store ticket information. It fetches additional details from HubSpot (Owners, Companies, Contacts) and maintains a local SQLite database of transactions.

## Features

- **Webhook Endpoint**: Receives POST requests from HubSpot Ticket webhooks.
- **Data Enrichment**: Automatically fetches:
  - Owner details (Name, Email)
  - Associated Company details (Name, City)
  - Associated Contact details (Name, Phone)
- **Database Storage**: Stores enriched ticket data in a local SQLite database (`hubspot_learning.db`).
- **HubSpot Client**: A modular client for interacting with the HubSpot CRM API.

## Prerequisites

- Python 3.11+
- [HubSpot Developer Account](https://developers.hubspot.com/) with a Private App Access Token.
- `ngrok` or similar for local webhook testing.

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Hubspot
    ```

2.  **Create and activate a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install fastapi uvicorn requests python-dotenv sqlalchemy
    ```

4.  **Configure environment variables**:
    Create a `.env` file in the root directory:
    ```env
    HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token_here
    ```

## Running the Application

1.  **Start the FastAPI server**:
    ```bash
    uvicorn main:app --reload --port 3000
    ```

2.  **Expose local server to the internet** (for HubSpot webhooks):
    ```bash
    ngrok http 3000
    ```
    Update your HubSpot webhook subscription with the ngrok URL (e.g., `https://<random-id>.ngrok-free.app/webhook`).

## Project Structure

- `main.py`: The entry point for the FastAPI application.
- `hubspot_client.py`: Handles all requests to the HubSpot API.
- `database.py`: Defines the SQLAlchemy models and database connection.
- `hubspot_learning.db`: (Auto-generated) Local SQLite database.
- `.env`: (Not committed) Contains sensitive API credentials.
- `.gitignore`: Specifies files and directories to be ignored by Git.
