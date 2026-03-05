export async function closeHubSpotTicket(hubspotId) {
  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/tickets/${hubspotId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { hs_pipeline_stage: process.env.HUBSPOT_CLOSED_STAGE_ID || '4' } 
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // 🧹 We removed the bulky console.log here to keep your terminal clean!
    throw new Error(errorData.message || 'HubSpot update failed');
  }

  return response.json();
}

export async function getTicketDetails(hubspotId) {
  try {
    const properties = 'subject,hs_ticket_priority,hs_pipeline_stage,hubspot_owner_id,string_tension,target_completion_date,required_parts,warranty_status,equipment_issue';
    const associations = 'contact,company';

    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/tickets/${hubspotId}?properties=${properties}&associations=${associations}`, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) throw new Error('Failed to fetch ticket');

    const ticketData = await response.json();
    const props = ticketData.properties || {};

    const ticketName = props.subject || 'Unnamed Ticket';
    const priority = props.hs_ticket_priority || 'Low';
    const pipelineStage = props.hs_pipeline_stage || 'New';
    const ownerId = props.hubspot_owner_id;
    const equipmentIssue = props.equipment_issue || 'Unknown Issue';

    const stringTension = props.string_tension || null;
    const targetCompletionDate = props.target_completion_date || null;
    const requiredParts = props.required_parts || null;
    const warrantyStatus = props.warranty_status || null;

    let customerName = 'Unassigned';
    let companyName = 'Independent';
    let ownerName = 'Unassigned';

    const contactAssoc = ticketData.associations?.contact?.results || ticketData.associations?.contacts?.results;
    if (contactAssoc && contactAssoc.length > 0) {
      const contactRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactAssoc[0].id}?properties=firstname,lastname`, {
        headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` }
      });
      if (contactRes.ok) {
        const data = await contactRes.json();
        customerName = `${data.properties?.firstname || ''} ${data.properties?.lastname || ''}`.trim() || 'Unknown Customer';
      }
    }

    const companyAssoc = ticketData.associations?.company?.results || ticketData.associations?.companies?.results;
    if (companyAssoc && companyAssoc.length > 0) {
      const companyRes = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${companyAssoc[0].id}?properties=name`, {
        headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` }
      });
      if (companyRes.ok) {
        const data = await companyRes.json();
        companyName = data.properties?.name || 'Independent';
      }
    }

    if (ownerId) {
      const ownerRes = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
        headers: { 'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` }
      });
      if (ownerRes.ok) {
        const data = await ownerRes.json();
        ownerName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown Owner';
      }
    }

    return {
      ticketName, customerName, companyName, ownerName, priority, pipelineStage,
      stringTension, targetCompletionDate, requiredParts, warrantyStatus, equipmentIssue
    };
  } catch (error) {
    console.error("Enrichment failed:", error.message);
    return { ticketName: 'Unknown', customerName: 'Unassigned', companyName: 'Independent', ownerName: 'Unassigned', priority: 'Low', pipelineStage: 'New', stringTension: null, targetCompletionDate: null, requiredParts: null, warrantyStatus: null, equipmentIssue: 'Unknown Issue' }; // 🚀 Fixed: Returns a string instead of null!
  }
}