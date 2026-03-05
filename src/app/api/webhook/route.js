import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import { getTicketDetails } from '../../../services/hubspot'; // Service imported

export async function POST(request) {
  try {
    // 1. Read the raw body as text for precise cryptographic hashing
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-hubspot-signature');
    const webhookSecret = process.env.HUBSPOT_WEBHOOK_SECRET;

    // 2. Security Check 1: Ensure our server has the secret configured
    if (!webhookSecret) {
      console.error("🛑 Server configuration error: Missing Webhook Secret");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 3. Security Check 2: Ensure the request actually has a signature
    if (!signatureHeader) {
      console.error("🛑 Security Breach: Missing Signature Header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Mathematical Verification (HMAC SHA-256)
    const hash = crypto
      .createHash('sha256')
      .update(webhookSecret + rawBody)
      .digest('hex');

    if (hash !== signatureHeader) {
      console.error("🛑 Security Breach: Invalid Signature Detected");
      return NextResponse.json({ error: "Unauthorized signature" }, { status: 401 });
    }

    // 5. If the math matches, we parse the securely verified data
    const payload = JSON.parse(rawBody);
    const event = payload[0]; 

    if (!event || !event.objectId || !event.propertyValue) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const ticketIdStr = event.objectId.toString();

    // 👉 6. DATA ENRICHMENT: Fetch the "Full Picture" from HubSpot before saving
    const enrichedData = await getTicketDetails(ticketIdStr);

    // 7. Save or update the enriched data in our SQLite database
    const newTicket = await prisma.equipmentTicket.upsert({
      where: {
        hubspotTicketId: ticketIdStr,
      },
      update: {
        equipmentIssue: enrichedData.equipmentIssue,
        occurredAt: new Date(event.occurredAt),
        // status: 'Open', 
        // Automatically move to 'Resolved' if HubSpot says it's closed, otherwise keep it 'Open'
        status: enrichedData.pipelineStage === (process.env.HUBSPOT_CLOSED_STAGE_ID || '4') ? 'Resolved' : 'Open',
        ticketName: enrichedData.ticketName,
        customerName: enrichedData.customerName,
        companyName: enrichedData.companyName,
        ownerName: enrichedData.ownerName,
        priority: enrichedData.priority,
        pipelineStage: enrichedData.pipelineStage,
        stringTension: enrichedData.stringTension,              // <-- NEW
        targetCompletionDate: enrichedData.targetCompletionDate, // <-- NEW
        requiredParts: enrichedData.requiredParts,              // <-- NEW
        warrantyStatus: enrichedData.warrantyStatus             // <-- NEW
      },
      create: {
        hubspotTicketId: ticketIdStr,
        equipmentIssue: enrichedData.equipmentIssue,
        occurredAt: new Date(event.occurredAt),
        status: 'Open',
        ticketName: enrichedData.ticketName,
        customerName: enrichedData.customerName,
        companyName: enrichedData.companyName,
        ownerName: enrichedData.ownerName,
        priority: enrichedData.priority,
        pipelineStage: enrichedData.pipelineStage,
        stringTension: enrichedData.stringTension,              // <-- NEW
        targetCompletionDate: enrichedData.targetCompletionDate, // <-- NEW
        requiredParts: enrichedData.requiredParts,              // <-- NEW
        warrantyStatus: enrichedData.warrantyStatus             // <-- NEW
      },
    });

    console.log("✅ Securely verified, enriched & saved ticket:", newTicket.hubspotTicketId);
    return NextResponse.json({ success: true, ticket: newTicket }, { status: 200 });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}