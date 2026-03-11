# Engineer's Handbook: Setup, Workflows & Troubleshooting

This document provides definitive technical instructions for running, debugging, and maintaining the HubSpot POC and SmashOps.pro platform.

---

## 🛠️ Complete Setup Guide

### 1. HubSpot Property Configuration
For the sync engine to function correctly, the following properties **must** exist in your HubSpot portal with the exact internal names specified:

| Field Label | Internal Name | Type |
| :--- | :--- | :--- |
| **Sales Investigation Required** | `sales_investigation_required` | Checkbox (Yes/No) |
| **Equipment Issue** | `equipment_issue` | Dropdown (Broken String, Shattered Frame, etc.) |
| **Warranty Status** | `warranty_status` | Dropdown (Active, Expired, Void) |
| **Required Parts** | `required_parts` | Multiple Checkboxes |
| **SLA Deadline** | `sla_deadline` | Date Picker (Calculated by Backend) |

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory. Combine variables as per your deployment type:

```env
# Database
DATABASE_URL="file:./dev.db"

# HubSpot Authentication (Public/Private)
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
HUBSPOT_ACCESS_TOKEN=your_private_app_token
REDIRECT_URI=http://localhost:8000/oauth-callback

# Webhooks & Security
HUBSPOT_WEBHOOK_SECRET=your_webhook_secret
NEXTAUTH_SECRET=random_string_32_chars
NEXTAUTH_URL=http://localhost:3000
TECH_PASS=your_secure_password
```

### 3. Local Execution (Docker)
The recommended way to run the stack is via Docker Compose:
```bash
docker-compose up --build
```
- **Backend API**: `http://localhost:8000`
- **Dashboard**: `http://localhost:3000`

---

## 🔄 Development Workflows

### Database Migrations
If you are using the Prisma-based stack (from `priyanshu.md`):
```bash
npx prisma generate
npx prisma db push
```
To view the database in a GUI:
```bash
npx prisma studio
```

### The "OAuth Tunnel" Trick
When deploying to a GCP VM without HTTPS, use this tunnel to authorize via your local browser:
```bash
gcloud compute ssh static-host --zone us-central1-c -- -L 8000:localhost:8000
```
Then visit `http://localhost:8000/install`.

---

## 🚨 Troubleshooting & "Tricks"

### Common Issue Resolution Matrix

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **"Table does not exist"** | Database not initialized | Run `npx prisma db push` or check `investigations.db` volume. |
| **Webhook 403/401** | Secret mismatch | Verify `HUBSPOT_WEBHOOK_SECRET` against the HubSpot Developer portal. |
| **Port 3000 in use** | Ghost processes | Run `fuser -k 3000/tcp` to force kill. |
| **SLA not calculating** | Missing property | Ensure `investigation_reason` property exists in HubSpot. |

### Webhook Development with Ngrok
To test real-time events on your local machine:
1. Start ngrok: `ngrok http 3000`
2. Update **HubSpot Private App > Webhooks > Target URL** with the ngrok address.
3. Subscribe to `equipment_issue` and `hs_pipeline_stage` events.

### Data Verification
Manually trigger a sync and verify the response:
```bash
curl -X POST http://localhost:8000/sync-tickets
```
Check local logs:
```bash
docker-compose logs -f backend
```

---

## 🌟 Best Practices
- **Persistent Volumes**: Always mount `./investigations.db` (or `dev.db`) as a Docker volume to ensure tokens survive container restarts.
- **Cryptographic Verification**: Never disable webhook signature checking in production; it prevents SSRF and injection attacks.
- **Graceful Shutdowns**: Use `docker-compose down` instead of stopping the terminal to allow the SQLite database to flush pendings.

---

## 🔗 Internal References
- [Hubspot_Work_Summary.md](file:///home/raghavgupta/hubspot-poc/HubSpot_Work_Summary.md)
- [README.md](file:///home/raghavgupta/hubspot-poc/README.md)
