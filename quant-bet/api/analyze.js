export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: 'Groq API key not configured' });
 
  try {
    const bufs = [];
    for await (const chunk of req) bufs.push(chunk);
    const { player, prop, game, sport, allProps } = JSON.parse(Buffer.concat(bufs).toString());
 
    const sname = sport === 'nba' ? 'NBA' : 'MLB';
    const prompt = `You are QUANT-BET, an elite ${sname} sports analyst. Platform: PrizePicks only. The fixed break-even is 54.3% on every single pick — this is the only threshold that matters.
 
Player: ${player.name} (${player.team}, ${player.position || '—'})
Game: ${game}
 
FOCUSED PROP:
${prop.stat} ${prop.line} | Best side: ${prop.bestSide} | De-vigged true probability: ${prop.truePct}% | Edge vs 54.3%: ${prop.ev}% | Over avg odds: ${prop.avgO} | Under avg odds: ${prop.avgU} | Books: ${prop.books}
 
ALL PROPS FOR THIS PLAYER:
${allProps}
 
Using Pillar C (spatial matchup geometry), Pillar D (mean reversion / recency bias exploitation), and Pillar E (juice confirmation as signal strength), deliver:
 
THE BEST BET: [Stat] [Line] [More/Less]
THE WHY: [2-3 sentences on the specific edge today — matchup, recent form, or statistical anomaly]
THE EVIDENCE: [Key supporting metrics — usage rate, L5 game log trend, matchup defensive rank, or batted ball profile]
SIMULATION: [Projected outcome range and estimated win probability vs 54.3% break-even]
VERDICT: FIRE / LEAN / PASS — one sentence
 
Be direct and quantitative. Reference the true probabilities. Flag if this prop has dramatically more edge than the others.`;
 
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
 
    if (!r.ok) {
      const err = await r.json();
      return res.status(r.status).json({ error: err.error?.message || 'Groq error' });
    }
 
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ text });
 
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}