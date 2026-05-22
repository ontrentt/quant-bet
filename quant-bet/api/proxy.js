export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  const { target } = req.query;
  if (!target) return res.status(400).json({ error: 'Missing target' });
 
  const decoded = decodeURIComponent(target);
 
  try {
    let fetchOpts = { method: 'GET' };
 
    if (decoded.includes('prizepicks.com')) {
      fetchOpts = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://app.prizepicks.com',
          'Referer': 'https://app.prizepicks.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
        },
      };
    }
 
    const upstream = await fetch(decoded, fetchOpts);
    const text = await upstream.text();
    res.status(upstream.status)
      .setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
      .send(text);
 
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}