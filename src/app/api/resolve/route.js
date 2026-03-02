import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { ticketId, hubspotId } = await request.json();

    // 1. Tell HubSpot to close the ticket
    const hubspotResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/tickets/${hubspotId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { hs_pipeline_stage: '4' } // Confirmed ID from your settings
      }),
    });

    if (!hubspotResponse.ok) {
      const errorData = await hubspotResponse.json();
      console.error('HubSpot API Error:', errorData);
      throw new Error(errorData.message || 'HubSpot update failed');
    }

    // 2. Soft Delete: Keep the data, but change the status
    await prisma.equipmentTicket.update({
      where: { id: ticketId },
      data: { status: 'Resolved' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resolve endpoint crash:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}