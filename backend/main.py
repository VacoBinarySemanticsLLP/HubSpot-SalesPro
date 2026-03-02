import os
import json
import requests
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import SessionLocal, Investigation, HubSpotToken
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
# Expanded scopes to allow reading Company data and writing back to Tickets
SCOPES = "crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.companies.write tickets"


class StatusUpdate(BaseModel):
    status: str
    comments: str | None = None


STATUS_TO_PIPELINE_STAGE = {
    "Open": "1",
    "In Progress": "2",
    "Resolved": "4",
}

STAGE_TO_STATUS = {v: k for k, v in STATUS_TO_PIPELINE_STAGE.items()}

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- PHASE 1: OAUTH ---
@app.get("/install")
def install():
    auth_url = (
        f"https://app.hubspot.com/oauth/authorize?"
        f"client_id={CLIENT_ID}&"
        f"redirect_uri={REDIRECT_URI}&"
        f"scope={SCOPES}"
    )
    return RedirectResponse(url=auth_url)

@app.get("/oauth-callback")
def oauth_callback(code: str, db: Session = Depends(get_db)):
    token_url = "https://api.hubapi.com/oauth/v1/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": code
    }
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        return {"error": "Token exchange failed", "details": response.json()}
    
    tokens = response.json()
    db.query(HubSpotToken).delete()
    new_token = HubSpotToken(access_token=tokens['access_token'], refresh_token=tokens['refresh_token'])
    db.add(new_token)
    db.commit()
    return {"message": "Successfully connected to HubSpot!"}

# --- PHASE 2: ENRICHED WEBHOOK ---
@app.post("/webhooks")
async def hubspot_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    
    print("\n" + "="*50)
    print("RECV: WEBHOOK PAYLOAD")
    print(json.dumps(payload, indent=2))
    print("="*50 + "\n")

    token_record = db.query(HubSpotToken).first()
    if not token_record:
        return {"status": "no_token_in_db"}

    for event in payload:
        ticket_id = event.get('objectId')
        if event.get('propertyName') == "sales_investigation_required" and event.get('propertyValue') == "Yes":
            
            # 1. Fetch Ticket Subject & Associated Companies
            headers = {"Authorization": f"Bearer {token_record.access_token}"}
            hs_url = f"https://api.hubapi.com/crm/v3/objects/tickets/{ticket_id}"
            hs_res = requests.get(hs_url, headers=headers, params={"properties": "subject", "associations": "companies"})
            
            subject = "New Investigation"
            merchant = "Unknown Merchant"

            if hs_res.status_code == 200:
                data = hs_res.json()
                subject = data['properties'].get('subject', "No Subject")
                
                # 2. Extract Merchant (Company) Name
                associations = data.get('associations', {}).get('companies', {}).get('results', [])
                if associations:
                    company_id = associations[0]['id']
                    comp_res = requests.get(f"https://api.hubapi.com/crm/v3/objects/companies/{company_id}", 
                                         headers=headers, params={"properties": "name"})
                    if comp_res.status_code == 200:
                        merchant = comp_res.json()['properties'].get('name', "Unknown Merchant")

            # 3. Save to Local DB
            existing = db.query(Investigation).filter(Investigation.ticket_id == str(ticket_id)).first()
            if not existing:
                new_inv = Investigation(
                    ticket_id=str(ticket_id),
                    merchant_name=merchant, # Make sure your DB model has this field!
                    reason=subject,
                    status="Open"
                )
                db.add(new_inv)
                print(f"SAVED: {merchant} | {subject}")
    
    db.commit()
    return {"status": "success"}

# --- PHASE 3: SYNC-BACK (UI -> HubSpot) ---
@app.post("/investigations/{ticket_id}/resolve")
def resolve_investigation(ticket_id: str, comments: str, db: Session = Depends(get_db)):
    token = db.query(HubSpotToken).first()
    if not token: raise HTTPException(status_code=401, detail="Not authenticated")

    # 1. Update HubSpot Ticket Status (Setting to 'Closed' stage)
    # Note: Replace 'closed' with your actual internal Stage ID if different
    url = f"https://api.hubapi.com/crm/v3/objects/tickets/{ticket_id}"
    headers = {"Authorization": f"Bearer {token.access_token}"}
    data = {"properties": {"hs_pipeline_stage": "4"}} # '4' is often the default 'Closed' ID
    
    hs_res = requests.patch(url, headers=headers, json=data)

    if hs_res.status_code == 200:
        # 2. Update Local Record
        inv = db.query(Investigation).filter(Investigation.ticket_id == ticket_id).first()
        if inv:
            inv.status = "Resolved"
            inv.comments = comments
            db.commit()
        return {"status": "success", "message": f"Ticket {ticket_id} closed in HubSpot"}
    
    return {"status": "error", "hubspot_error": hs_res.json()}


@app.post("/investigations/{ticket_id}/status")
def update_investigation_status(
    ticket_id: str, payload: StatusUpdate, db: Session = Depends(get_db)
):
    token = db.query(HubSpotToken).first()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    desired_status = payload.status
    stage = STATUS_TO_PIPELINE_STAGE.get(desired_status)
    if stage is None:
        raise HTTPException(status_code=400, detail="Unsupported status value")

    url = f"https://api.hubapi.com/crm/v3/objects/tickets/{ticket_id}"
    headers = {"Authorization": f"Bearer {token.access_token}"}
    data = {"properties": {"hs_pipeline_stage": stage}}

    hs_res = requests.patch(url, headers=headers, json=data)

    if hs_res.status_code == 200:
        inv = db.query(Investigation).filter(Investigation.ticket_id == ticket_id).first()
        if inv:
            inv.status = desired_status
            if payload.comments is not None:
                inv.comments = payload.comments
            db.commit()
        return {
            "status": "success",
            "message": f"Ticket {ticket_id} updated to {desired_status} in HubSpot",
        }

    return {"status": "error", "hubspot_error": hs_res.json()}

@app.get("/investigations")
def get_investigations(db: Session = Depends(get_db)):
    return db.query(Investigation).all()


@app.post("/sync-tickets")
def sync_tickets(db: Session = Depends(get_db)):
    """
    One-shot sync:
    - Pull HubSpot tickets that require investigation
    - Write any missing ones into the local `investigations` table
    """
    token = db.query(HubSpotToken).first()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with HubSpot")

    headers = {"Authorization": f"Bearer {token.access_token}"}

    url = "https://api.hubapi.com/crm/v3/objects/tickets"
    params = {
        "limit": 50,
        "properties": "subject,hs_pipeline_stage,sales_investigation_required",
        "associations": "companies",
    }

    created = 0
    updated = 0

    res = requests.get(url, headers=headers, params=params)
    if res.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail={"message": "Failed to fetch tickets from HubSpot", "body": res.json()},
        )

    data = res.json()
    for ticket in data.get("results", []):
        ticket_id = ticket.get("id")
        props = ticket.get("properties", {}) or {}

        # Only pull tickets marked as "sales investigation required"
        if props.get("sales_investigation_required") != "Yes":
            continue

        subject = props.get("subject") or "No Subject"
        stage_id = props.get("hs_pipeline_stage")
        status = STAGE_TO_STATUS.get(stage_id, "Open")

        merchant_name = "Unknown Merchant"
        company_ids = (
            ticket.get("associations", {})
            .get("companies", {})
            .get("results", [])
        )
        if company_ids:
            company_id = company_ids[0].get("id")
            if company_id:
                comp_res = requests.get(
                    f"https://api.hubapi.com/crm/v3/objects/companies/{company_id}",
                    headers=headers,
                    params={"properties": "name"},
                )
                if comp_res.status_code == 200:
                    merchant_name = (
                        comp_res.json()
                        .get("properties", {})
                        .get("name", "Unknown Merchant")
                    )

        existing = (
            db.query(Investigation)
            .filter(Investigation.ticket_id == str(ticket_id))
            .first()
        )

        if existing:
            existing.merchant_name = merchant_name
            existing.reason = subject
            existing.status = status
            updated += 1
        else:
            new_inv = Investigation(
                ticket_id=str(ticket_id),
                merchant_name=merchant_name,
                reason=subject,
                status=status,
            )
            db.add(new_inv)
            created += 1

    db.commit()

    return {"created": created, "updated": updated}
