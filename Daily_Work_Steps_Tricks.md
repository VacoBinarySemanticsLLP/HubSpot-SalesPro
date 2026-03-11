# Daily Work Steps & Developer "Tricks"

This document outlines the standard operating procedures and advanced techniques used during the development and maintenance of the HubSpot POC.

---

## 🏗️ Development Lifecycle

### 1. Local Environment Setup
To start the full stack locally with fresh configuration:
```bash
docker-compose up --build
```
> [!TIP]
> Use the `--build` flag frequently during development to ensure all code changes in the FastAPI backend or Next.js frontend are reflected in the containers.

### 2. Handling OAuth Scopes
When adding new features that require additional HubSpot metadata:
1. Update Scopes in the **HubSpot Developer Portal**.
2. Re-trigger the `/install` flow to refresh tokens with the new permissions.
3. Update the `REDIRECT_URI` in `.env` to match the portal settings exactly.

---

## 🚀 Deployment Tricks (GCP)

### 💡 The SSH Tunneling Trick
Since HubSpot requires `localhost` or `HTTPS` for OAuth redirects, use an SSH tunnel to authorize a remote VM via your local browser:
```bash
gcloud compute ssh static-host --zone us-central1-c -- -L 8000:localhost:8000
```
- This maps the VM's port 8000 to your laptop.
- Open `http://localhost:8000/install` on your local machine to complete the HubSpot handshake.

### 🔒 Environment Management
On the VM, always use `cat > .env << 'EOF'` to create environment files without worrying about special characters being interpreted by the shell.

---

## 🛠️ Debugging & Maintenance "Tricks"

### Real-Time Webhook Testing
Use **ngrok** to expose your local or VM-based backend to the public internet for testing HubSpot webhooks without deploying to a public domain:
```bash
ngrok http 8000
```
Update the HubSpot Webhook URL to the ngrok-provided HTTPS address.

### Persistent SQL Access
To inspect the local database directly without stopping containers:
```bash
docker-compose exec backend sqlite3 investigations.db
```
Then run SQL queries like:
```sql
SELECT * FROM investigations LIMIT 5;
```

### One-Shot Sync Recovery
If webhooks fail or the system goes offline, use the manual sync endpoint to reconcile data:
```bash
curl -X POST http://<IP>:8000/sync-tickets
```

---

## 🌟 Best Practices
- **Docker Volumes**: Always verify `docker-compose.yml` has volume mounts for `.db` files to prevent data loss on container teardown.
- **Status Mapping**: Maintain the mapping between dashboard statuses and HubSpot stages in a dedicated config or dictionary in `main.py` for easy adjustments.
- **Frontend Variables**: Ensure all frontend API calls use `NEXT_PUBLIC_BACKEND_URL` to facilitate switching between local and production backends.
