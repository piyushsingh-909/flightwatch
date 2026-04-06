export default async function handler(req, res) {
  // CORS headers so the frontend can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.AIRLABS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    // Forward any bounding box params the frontend sends
    const { lat, lng, dist } = req.query;
    let url = `https://airlabs.co/api/v9/flights?api_key=${apiKey}`;
    if (lat && lng && dist) {
      url += `&lat=${lat}&lng=${lng}&dist=${dist}`;
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text });
    }

    const data = await upstream.json();
    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'AirLabs API error' });
    }

    // Return just the flights array
    return res.status(200).json({ flights: data.response || [] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
