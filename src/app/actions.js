'use server';

import prisma from '@/lib/prisma';
import { closeHubSpotTicket } from '@/services/hubspot';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth/next";

export async function resolveTicketAction(ticketId, hubspotId) {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized: Please sign in to resolve tickets.');
    if (!ticketId || !hubspotId) throw new Error('Missing required IDs for resolution.');

    try {
        await prisma.equipmentTicket.update({
            where: { id: parseInt(ticketId) },
            data: { status: 'Resolved', hubspotSyncStatus: 'PENDING' }
        });

        try {
            await closeHubSpotTicket(hubspotId);

            await prisma.equipmentTicket.update({
                where: { id: parseInt(ticketId) },
                data: { hubspotSyncStatus: 'SYNCED' }
            });

        } catch (hubspotError) {
            // 🧹 Clean Terminal Log: Only print the string, no stack trace
            console.error(`⚠️ HubSpot Sync Failed for Ticket ${ticketId}: ${hubspotError.message}`);

            await prisma.equipmentTicket.update({
                where: { id: parseInt(ticketId) },
                data: {
                    hubspotSyncStatus: 'FAILED',
                    // 🧹 Clean DB: Keep only the first sentence!
                    lastSyncError: hubspotError.message ? hubspotError.message.split('.')[0] : 'Unknown CRM error'
                }
            });
        }

        revalidatePath('/');
        return { success: true };

    } catch (error) {
        console.error(`❌ Critical error resolving ticket ${ticketId}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

export async function retrySyncAction(ticketId, hubspotId) {
    const session = await getServerSession();
    if (!session) throw new Error('Unauthorized');

    try {
        await closeHubSpotTicket(hubspotId);

        await prisma.equipmentTicket.update({
            where: { id: parseInt(ticketId) },
            data: { hubspotSyncStatus: 'SYNCED', lastSyncError: null }
        });

        revalidatePath('/');
        return { success: true };

    } catch (error) {
        console.error(`⚠️ Retry failed for Ticket ${ticketId}: ${error.message}`);
        
        await prisma.equipmentTicket.update({
            where: { id: parseInt(ticketId) },
            data: { 
              // 🧹 Clean DB: Keep only the first sentence!
              lastSyncError: error.message ? error.message.split('.')[0] : 'Unknown CRM error on retry' 
            }
        });
        
        revalidatePath('/'); 
        return { success: false, error: error.message };
    }
}