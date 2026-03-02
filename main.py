from fastapi import FastAPI, Request, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, TicketRecord
import hubspot_client

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/webhook")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    if not data or not isinstance(data, list):
        return {"status": "error", "message": "Invalid payload"}
    
    webhook_item = data[0]
    ticket_id = webhook_item.get("objectId")
    
    # 1. Fetch Ticket Data
    ticket_data = hubspot_client.get_ticket_details(ticket_id)
    props = ticket_data.get("properties", {})
    
    # 2. Logic Filter: Trigger only if investigation is Required
    is_required = props.get("sales_investigation_required")
    if is_required != "Yes":
        print(f"Skipping Ticket {ticket_id}: Investigation Required is '{is_required}'")
        return {"status": "ignored"}

    print(f"Processing Investigation for Merchant ID: {props.get('merchant_id')}")

    # 3. Extract IDs and fetch enrichment data
    associations = ticket_data.get("associations", {})
    owner_id = props.get("hubspot_owner_id")
    
    company_list = associations.get("companies", {}).get("results", [])
    company_id = company_list[0].get("id") if company_list else None
    
    contact_list = associations.get("contacts", {}).get("results", [])
    contact_id = contact_list[0].get("id") if contact_list else None

    owner_data = hubspot_client.get_owner_details(owner_id)
    company_data = hubspot_client.get_company_details(company_id)
    contact_data = hubspot_client.get_contact_details(contact_id)

    # 4. Prepare data and Upsert
    update_data = {
        "subject": props.get("subject"),
        "merchant_id": props.get("merchant_id"),
        "restaurant_tier": props.get("restaurant_tier"),
        "investigation_reason": props.get("investigation_reason"),
        "sales_investigation_required": is_required,
        "owner_name": f"{owner_data.get('firstName', '')} {owner_data.get('lastName', '')}".strip(),
        "owner_email": owner_data.get('email'),
        "company_name": company_data.get('name'),
        "company_city": company_data.get('city'),
        "contact_name": f"{contact_data.get('firstname', '')} {contact_data.get('lastname', '')}".strip(),
        "contact_phone": contact_data.get('phone'),
        "raw_payload": data
    }

    existing_record = db.query(TicketRecord).filter(TicketRecord.ticket_id == ticket_id).first()
    
    if existing_record:
        for key, value in update_data.items():
            setattr(existing_record, key, value)
        print(f"Updated Restaurant Case: {ticket_id}")
    else:
        new_record = TicketRecord(ticket_id=ticket_id, **update_data)
        db.add(new_record)
        print(f"Saved New Restaurant Case: {ticket_id}")

    db.commit()
    return {"status": "success"}