import requests
import os
from urllib3.util import Retry
from requests.adapters import HTTPAdapter
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("HUBSPOT_ACCESS_TOKEN")

# Setup robust session with retries
session = requests.Session()
session.headers.update({"Authorization": f"Bearer {ACCESS_TOKEN}"})

retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["HEAD", "GET", "OPTIONS"]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("https://", adapter)
session.mount("http://", adapter)

def get_ticket_details(ticket_id):
    """Fetch ticket details including new restaurant properties."""
    url = f"https://api.hubapi.com/crm/v3/objects/tickets/{ticket_id}"
    params = {
        "properties": "subject,hubspot_owner_id,merchant_id,restaurant_tier,investigation_reason,sales_investigation_required",
        "associations": "companies,contacts" 
    }
    try:
        response = session.get(url, params=params, timeout=10)
        if response.status_code != 200:
            print(f"Ticket API Error {response.status_code}: {response.text}")
        return response.json()
    except Exception as e:
        print(f"Connection Error fetching ticket {ticket_id}: {str(e)}")
        return {}

def get_owner_details(owner_id):
    if not owner_id:
        return {}
    url = f"https://api.hubapi.com/crm/v3/owners/{owner_id}"
    try:
        response = session.get(url, timeout=10)
        return response.json()
    except Exception as e:
        print(f"Connection Error fetching owner {owner_id}: {str(e)}")
        return {}

def get_company_details(company_id):
    if not company_id:
        return {}
    url = f"https://api.hubapi.com/crm/v3/objects/companies/{company_id}"
    params = {"properties": "name,domain,city"}
    try:
        response = session.get(url, params=params, timeout=10)
        return response.json().get("properties", {})
    except Exception as e:
        print(f"Connection Error fetching company {company_id}: {str(e)}")
        return {}

def get_contact_details(contact_id):
    if not contact_id:
        return {}
    url = f"https://api.hubapi.com/crm/v3/objects/contacts/{contact_id}"
    params = {"properties": "firstname,lastname,phone,email"}
    try:
        response = session.get(url, params=params, timeout=10)
        return response.json().get("properties", {})
    except Exception as e:
        print(f"Connection Error fetching contact {contact_id}: {str(e)}")
        return {}