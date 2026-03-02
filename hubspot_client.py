import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

ACCESS_TOKEN = os.getenv("HUBSPOT_ACCESS_TOKEN")
HEADERS = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

def get_ticket_details(ticket_id):
    """Fetch ticket details and association IDs."""
    url = f"https://api.hubapi.com/crm/v3/objects/tickets/{ticket_id}"
    # Added 'associations' to the parameters to get linked Company/Contact IDs
    params = {
        "properties": "subject,hubspot_owner_id,equipment_issue",
        "associations": "companies,contacts" 
    }
    response = requests.get(url, headers=HEADERS, params=params)
    
    if response.status_code != 200:
        print(f"Ticket API Error {response.status_code}: {response.text}")
    return response.json()


def get_owner_details(owner_id):
    """Translate Owner ID into Name and Email."""
    if not owner_id:
        return {}
    url = f"https://api.hubapi.com/crm/v3/owners/{owner_id}"
    response = requests.get(url, headers=HEADERS)
    
    if response.status_code != 200:
        print(f"Owner API Error {response.status_code}: {response.text}")
    return response.json()


def get_company_details(company_id):
    """Fetch the Merchant/Company name."""
    if not company_id:
        return {}
    url = f"https://api.hubapi.com/crm/v3/objects/companies/{company_id}"
    params = {"properties": "name,domain,city"}
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json().get("properties", {})


def get_contact_details(contact_id):
    """Fetch the Customer/Contact name and phone."""
    if not contact_id:
        return {}
    url = f"https://api.hubapi.com/crm/v3/objects/contacts/{contact_id}"
    params = {"properties": "firstname,lastname,phone,email"}
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json().get("properties", {})