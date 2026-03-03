## Overview

This project consists of:

- **Backend**: FastAPI (`backend/`), using HubSpot OAuth and a local **SQLite** database (`investigations.db`).
- **Frontend**: Next.js (`frontend/`), talking to the FastAPI backend.
- **Database**: SQLite file, mounted from the host into the backend container.

You deploy everything to a **single GCP VM** using **Docker + docker-compose**, and connect it to a **HubSpot app** (public or private) so that you can sync ticket data into your VM.

- **If you have a Public HubSpot App**: You must go through an OAuth “install” flow (what this guide focuses on).
- **If you have a Private HubSpot App**: You can skip OAuth and use the private app access token directly (documented in a separate section below).  
  **Important**: The rest of the infrastructure (VM, Docker, frontend/backend) is the same regardless of app type.

---

## 1. Prerequisites

- **GCP**
  - A GCP project.
  - `gcloud` CLI installed and authenticated on your local machine.
  - Permissions to create a Compute Engine VM.
- **Local tools**
  - Docker and docker-compose (or Docker Desktop).
  - Git.
  - A browser that can open `http://localhost:8000` and `http://localhost:3000`.
- **HubSpot**
  - A HubSpot **Developer Account** (for public apps).
  - A standard HubSpot portal (where the app will be installed).
  - Either:
    - **Public App** (this is the main path), or
    - **Private App** (alternative path at the end; infra is the same).

---

## 2. Clone the project locally

On your **local machine**:

```bash
git clone <YOUR_REPO_URL> hubspot-poc
cd hubspot-poc
```

Replace `<YOUR_REPO_URL>` with your Git remote URL.

---

## 3. Create and configure the HubSpot app

### 3.1 Public HubSpot App (recommended for multi-portal installs)

1. In your **HubSpot Developer Account**, create a **Public App**.
2. Enable the scopes your app needs. For this project, the backend expects at least:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.companies.read`
   - `crm.objects.companies.write`
   - `tickets`
3. **Redirect URL for development / VM install step**
   - Set the redirect URL to:
     - `http://localhost:8000/oauth-callback`
   - This works with the **“localhost + SSH tunnel”** trick described later, even though the backend is running on a remote VM.
4. Copy:
   - **Client ID**
   - **Client Secret**

You will use these in your `.env` files.

### 3.2 Private HubSpot App (alternative)

If you use a **Private App** instead of a Public App:

- You **do not need OAuth routes** (`/install`, `/oauth-callback`) for your own portal.
- You will:
  - Create a Private App in your HubSpot portal.
  - Copy the **Private App access token**.
  - Configure the backend to use this token directly for HubSpot API calls.

The VM, Docker, and frontend setup are **the same**; only the authentication method differs. See **Section 10: Using a Private HubSpot App** for details.

---

## 4. Configure environment files locally

### 4.1 Backend `.env`

Create `backend/.env`:

```env
CLIENT_ID=<YOUR_HUBSPOT_CLIENT_ID>
CLIENT_SECRET=<YOUR_HUBSPOT_CLIENT_SECRET>
REDIRECT_URI=http://localhost:8000/oauth-callback
GCP_STATIC_IP=<YOUR_VM_STATIC_IP>  # Filled in later
```

- For now you can leave `GCP_STATIC_IP` blank or a placeholder; you will update it after the VM is created and you know its IP.

### 4.2 Frontend `.env.local`

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Locally, backend and frontend will run on the same machine. On the VM, this will be updated to use the VM’s IP.

### 4.3 Root `.env` (optional, used by docker-compose)

At the project root, create `.env` to hold the static IP used by `docker-compose.yml`:

```env
GCP_STATIC_IP=<YOUR_VM_STATIC_IP>  # update after VM creation
```

---

## 5. Run locally (optional sanity check)

From the project root on your **local machine**:

```bash
docker-compose up --build
```

You should be able to open:

- **Backend**: `http://localhost:8000/docs`
- **Frontend**: `http://localhost:3000`

This verifies Dockerfiles and basic wiring are correct before you move to the VM.

Stop with:

```bash
docker-compose down
```

---

## 6. Create and prepare the GCP VM

### 6.1 Create a VM instance

From your **local machine**:

```bash
gcloud compute instances create static-host \
  --zone=us-central1-c \
  --machine-type=e2-medium \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --tags=http-server,https-server \
  --address=<RESERVED_STATIC_IP_OR_LEAVE_OUT>
```

- Replace `static-host` and `us-central1-c` if you prefer different names/zones.
- You can reserve a static external IP in GCP and attach it here.

### 6.2 Open required firewall ports

Ensure the VM can be accessed on ports **8000 (backend)** and **3000 (frontend)** via HTTP:

- In the GCP console, under **VPC network → Firewall**, make sure the `http-server` tag allows port 80 and, if necessary, create additional firewall rules or a load balancer.
- For simple setups, you can:
  - Use port mapping via a reverse proxy (recommended), or
  - Temporarily open ports 8000 and 3000 in a custom firewall rule (for development only).

---

## 7. Copy code to the VM and configure env

### 7.1 SSH into the VM

From your **local machine**:

```bash
gcloud compute ssh static-host --zone us-central1-c
```

### 7.2 Install Docker and docker-compose on the VM

On the VM:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker
```

Verify:

```bash
docker --version
docker compose version  # or `docker-compose version` depending on distro
```

### 7.3 Clone the repo on the VM

On the VM:

```bash
git clone <YOUR_REPO_URL> hubspot-poc
cd hubspot-poc
```

### 7.4 Create VM env files

On the VM, in `hubspot-poc`:

1. **Root `.env`**:

   ```bash
   cat > .env << 'EOF'
   GCP_STATIC_IP=<YOUR_VM_EXTERNAL_IP>
   EOF
   ```

2. **Backend `.env`**:

   ```bash
   cat > backend/.env << 'EOF'
   CLIENT_ID=<YOUR_HUBSPOT_CLIENT_ID>
   CLIENT_SECRET=<YOUR_HUBSPOT_CLIENT_SECRET>
   REDIRECT_URI=http://localhost:8000/oauth-callback
   GCP_STATIC_IP=<YOUR_VM_EXTERNAL_IP>
   EOF
   ```

3. **Frontend `.env.local`**:

   ```bash
   cat > frontend/.env.local << 'EOF'
   NEXT_PUBLIC_BACKEND_URL=http://<YOUR_VM_EXTERNAL_IP>:8000
   EOF
   ```

Replace the placeholders with your real values.

---

## 8. Start the app on the VM

From `/home/<user>/hubspot-poc` on the VM:

```bash
docker-compose up -d --build
```

Verify containers:

```bash
docker-compose ps
```

You should see `backend` and `frontend` running.

Test from your **local machine** using the VM’s IP:

- Backend: `http://<YOUR_VM_EXTERNAL_IP>:8000/docs`
- Frontend: `http://<YOUR_VM_EXTERNAL_IP>:3000`

---

## 9. Complete OAuth install for a Public HubSpot App (localhost + SSH tunnel)

Because HubSpot requires HTTPS or `localhost` for redirect URLs, and your VM uses HTTP with an IP, you perform the OAuth install using a **localhost redirect** that is tunneled to the VM.

### 9.1 Ensure HubSpot app redirect URL

In your **HubSpot Public App** settings, set the redirect URL to:

- `http://localhost:8000/oauth-callback`

This must **exactly** match the VM backend `REDIRECT_URI` you set in `backend/.env`.

### 9.2 Open an SSH tunnel from your local machine

On your **local machine**:

```bash
gcloud compute ssh static-host --zone us-central1-c -- -L 8000:localhost:8000
```

- Keep this terminal **open**.  
- It forwards `localhost:8000` on your laptop to `localhost:8000` on the VM (where FastAPI is listening inside Docker).

### 9.3 Run the install flow

On your **local machine**, with the SSH tunnel open:

1. Open your browser to:

   - `http://localhost:8000/install`

2. You will be redirected to HubSpot’s auth screen.
3. Click **Authorize**.
4. On success, the backend responds with:

   ```json
   {"message":"Successfully connected to HubSpot!"}
   ```

Behind the scenes, the backend:

- Exchanges the authorization code for access and refresh tokens.
- Saves tokens into the local SQLite DB (`investigations.db` via `HubSpotToken` model).

You generally **do not need to run `/install` again** unless:

- You delete the DB.
- You revoke the app’s access in HubSpot.

---

## 10. Sync data from HubSpot to the VM

Once OAuth is complete and tokens are stored:

### 10.1 Trigger a one-shot sync

From your **local machine** (no SSH tunnel required for this step, just VM IP reachable):

```bash
curl -s -X POST "http://<YOUR_VM_EXTERNAL_IP>:8000/sync-tickets"
```

Expected response:

```json
{"created": X, "updated": Y}
```

- `created`: number of new investigations written to SQLite.
- `updated`: number of existing investigations updated.

### 10.2 Check investigations on the backend

```bash
curl -s "http://<YOUR_VM_EXTERNAL_IP>:8000/investigations"
```

You should see an array of investigation objects. These are what the frontend displays.

### 10.3 Use the frontend UI

Open in your browser:

- `http://<YOUR_VM_EXTERNAL_IP>:3000`

The frontend uses `NEXT_PUBLIC_BACKEND_URL` to call the backend and display investigations.

---

## 11. Using a Private HubSpot App instead of Public OAuth

If you prefer a **Private HubSpot App** (single-portal usage):

### 11.1 Create the Private App and token

1. In your main HubSpot portal (not the developer account), create a **Private App**.
2. Configure the same scopes (contacts, companies, tickets, etc.).
3. Copy the **Private App access token**.

### 11.2 Configure backend env for Private App

On the VM (and optionally locally), you can use:

```env
HUBSPOT_ACCESS_TOKEN=<YOUR_PRIVATE_APP_TOKEN>
```

You will need to adjust the backend code to:

- Use `HUBSPOT_ACCESS_TOKEN` directly in the `Authorization: Bearer <token>` header.
- Skip `/install` and `/oauth-callback` entirely (they are only for OAuth).
- Remove or ignore the `HubSpotToken` DB model if desired, since Private App tokens don’t use refresh tokens in the same way.

**Important**: The **VM + Docker + frontend + sync endpoints** remain the same; only how you authenticate with HubSpot changes. The deployment steps above are still valid.

---

## 12. Common troubleshooting tips

- **HubSpot error: invalid redirect URL**  
  - Check that the `redirect_uri` in your `/install` URL and the HubSpot app redirect URL match **exactly**.
  - For the localhost tunnel approach, both must be `http://localhost:8000/oauth-callback`.

- **`REDIRECT_URI` inside container is not what you expect**  
  - On the VM, run:

    ```bash
    docker-compose exec backend env | grep REDIRECT_URI
    ```

  - If it is wrong, check for overrides in `docker-compose.yml` under `environment:`, or incorrect values in `.env` / `backend/.env`.

- **`{"detail":"Method Not Allowed"}` when calling `/sync-tickets`**  
  - Use `POST`, not `GET`:

    ```bash
    curl -X POST http://<YOUR_VM_EXTERNAL_IP>:8000/sync-tickets
    ```

- **Frontend shows no data**  
  - Ensure:
    - `/sync-tickets` has been called successfully.
    - `/investigations` returns data.
    - `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local` points to the VM backend (`http://<YOUR_VM_EXTERNAL_IP>:8000`).

---

## 13. Summary of key commands

- **Local clone and test:**

  ```bash
  git clone <YOUR_REPO_URL> hubspot-poc
  cd hubspot-poc
  docker-compose up --build
  docker-compose down
  ```

- **Create/enter VM:**

  ```bash
  gcloud compute instances create static-host --zone us-central1-c ...
  gcloud compute ssh static-host --zone us-central1-c
  ```

- **On VM (once):**

  ```bash
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-plugin
  git clone <YOUR_REPO_URL> hubspot-poc
  cd hubspot-poc
  # create .env, backend/.env, frontend/.env.local
  docker-compose up -d --build
  ```

- **OAuth install (public app, localhost trick):**

  ```bash
  # on local machine
  gcloud compute ssh static-host --zone us-central1-c -- -L 8000:localhost:8000
  # then in browser: http://localhost:8000/install
  ```

- **Sync + check data (from local machine):**

  ```bash
  curl -X POST http://<YOUR_VM_EXTERNAL_IP>:8000/sync-tickets
  curl http://<YOUR_VM_EXTERNAL_IP>:8000/investigations
  ```

With this document, anyone starting from the same FastAPI + Next.js + SQLite codebase can deploy to a GCP VM, wire it to a HubSpot Public or Private App, and sync their HubSpot data into their VM successfully.

