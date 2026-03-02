import sqlite3

def view_data():
    conn = sqlite3.connect('hubspot_learning.db')
    cursor = conn.cursor()
    
    cursor.execute("SELECT ticket_id, subject, owner_name, owner_email FROM tickets")
    rows = cursor.fetchall()
    
    print("\n--- Current Database Records ---")
    for row in rows:
        print(f"ID: {row[0]} | Subject: {row[1]} | Owner: {row[2]} ({row[3]})")
    
    conn.close()

if __name__ == "__main__":
    view_data()