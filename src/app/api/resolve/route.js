import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; 

export async function POST(request) {
  try {
    const { ticketId, hubspotId } = await request.json();

    if (!ticketId || !hubspotId) {
      return NextResponse.json({ error: "Missing required IDs" }, { status: 400 });
    }

    // 1. Update our Local Database
    const updatedTicket = await prisma.equipmentTicket.update({
      where: { id: parseInt(ticketId) },
      data: { status: 'Resolved' }
    });

    // 2. The Bi-Directional Sync: Tell HubSpot to close the ticket!
    // Note: '4' is the default internal ID for the "Closed" stage in HubSpot's Support Pipeline.
    const hubspotResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/tickets/${hubspotId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_pipeline_stage: '4' // Moves it to the Closed column
        }
      })
    });

    if (!hubspotResponse.ok) {
      console.warn("⚠️ Local DB updated, but failed to sync back to HubSpot.");
    }

    return NextResponse.json({ success: true, ticket: updatedTicket }, { status: 200 });

  } catch (error) {
    console.error("❌ Failed to resolve ticket:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}