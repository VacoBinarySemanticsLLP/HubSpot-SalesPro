export async function closeHubSpotTicket(hubspotId) {
  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/tickets/${hubspotId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { hs_pipeline_stage: '4' } // Your confirmed Closed stage ID
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('HubSpot API Error:', errorData);
    throw new Error(errorData.message || 'HubSpot update failed');
  }

  return response.json();
}