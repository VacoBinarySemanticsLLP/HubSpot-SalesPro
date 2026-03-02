import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // 1. Catch the JSON payload thrown by HubSpot
    const payload = await request.json();

    // HubSpot sends an array of events, so we grab the first one
    const event = payload[0]; 

    // 2. Validate that we actually got data
    if (!event || !event.objectId || !event.propertyValue) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 3. Save or update the data in our SQLite database using Prisma
    const newTicket = await prisma.equipmentTicket.upsert({
      where: {
        hubspotTicketId: event.objectId.toString(),
      },
      update: {
        // If the ticket exists, just update the issue and the timestamp
        equipmentIssue: event.propertyValue,
        occurredAt: new Date(event.occurredAt),
      },
      create: {
        // If it's a brand new ticket, create the whole row
        hubspotTicketId: event.objectId.toString(),
        equipmentIssue: event.propertyValue,
        occurredAt: new Date(event.occurredAt),
      },
    });

    console.log("✅ Successfully saved ticket:", newTicket);

    // 4. Return a 200 OK so HubSpot knows we caught it
    return NextResponse.json({ success: true, ticket: newTicket }, { status: 200 });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}