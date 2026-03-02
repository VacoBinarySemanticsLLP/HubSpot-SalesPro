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
    
    # 1. Fetch Ticket & Association IDs
    ticket_data = hubspot_client.get_ticket_details(ticket_id)
    props = ticket_data.get("properties", {})
    associations = ticket_data.get("associations", {})

    # 2. Extract IDs safely
    owner_id = props.get("hubspot_owner_id")
    
    # Get the first associated company ID
    company_list = associations.get("companies", {}).get("results", [])
    company_id = company_list[0].get("id") if company_list else None
    
    # Get the first associated contact ID
    contact_list = associations.get("contacts", {}).get("results", [])
    contact_id = contact_list[0].get("id") if contact_list else None

    # 3. Fetch Data for all entities
    owner_data = hubspot_client.get_owner_details(owner_id)
    company_data = hubspot_client.get_company_details(company_id)
    contact_data = hubspot_client.get_contact_details(contact_id)

    # 4. Upsert into Database
    existing_record = db.query(TicketRecord).filter(TicketRecord.ticket_id == ticket_id).first()
    
    # Helper to build the name strings
    f_name = owner_data.get('firstName', '')
    l_name = owner_data.get('lastName', '')
    c_fname = contact_data.get('firstname', '')
    c_lname = contact_data.get('lastname', '')

    update_data = {
        "subject": props.get("subject"),
        "owner_name": f"{f_name} {l_name}".strip(),
        "owner_email": owner_data.get('email'),
        "company_name": company_data.get('name'),
        "company_city": company_data.get('city'),
        "contact_name": f"{c_fname} {c_lname}".strip(),
        "contact_phone": contact_data.get('phone'),
        "raw_payload": data
    }

    if existing_record:
        for key, value in update_data.items():
            setattr(existing_record, key, value)
        print(f"✅ Updated Ticket {ticket_id} with Company: {update_data['company_name']}")
    else:
        new_record = TicketRecord(ticket_id=ticket_id, **update_data)
        db.add(new_record)
        print(f"💾 Saved New Ticket {ticket_id}")

    db.commit()
    return {"status": "success"}