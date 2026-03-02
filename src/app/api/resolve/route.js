import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { closeHubSpotTicket } from '../../../services/hubspot';

export async function POST(request) {
  try {
    const { ticketId, hubspotId } = await request.json();

    // 1. Delegate the external API call to our new Service Layer
    await closeHubSpotTicket(hubspotId);

    // 2. Perform the Soft Delete on our local database
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