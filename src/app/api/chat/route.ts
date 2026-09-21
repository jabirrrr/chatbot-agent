import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], botConfig } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Try to proxy the request to the Python backend's preview endpoint
    // It will securely use the Admin Panel's configured Platform Integrations.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    let replyText = '';
    let upstreamError = '';
    let live = false;
    let provider = 'simulated';

    try {
      const backendRes = await fetch(`${apiUrl}/api/v1/chatbots/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          botConfig
        })
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        replyText = data.reply;
        live = data.live;
        provider = data.provider;
        
        return NextResponse.json({
          reply: replyText.trim(),
          live: live,
          provider: provider
        });
      } else {
        const rawErr = await backendRes.text();
        console.warn('Backend preview error:', backendRes.status, rawErr);
        try {
          const parsed = JSON.parse(rawErr);
          upstreamError = parsed.detail || parsed.error?.message || rawErr;
        } catch {
          upstreamError = rawErr;
        }
      }
    } catch (callErr: any) {
      console.error('Error during backend network call:', callErr);
      upstreamError = callErr?.message || 'Connection failed';
    }

    // Dynamic contextual fallback if backend fails or no LLM key is configured in Admin Panel
    const botName = botConfig?.name || 'Helio LeadBot';
    const botDesc = botConfig?.businessDescription || 'We are an online business providing premium products and services with prompt delivery and support.';
    const lower = message.toLowerCase();
    
    let fallbackReply = `Thank you for reaching out to ${botName}! Based on our services, I'd be pleased to help you with ${botDesc.slice(0, 80)}... What can I assist you with today?`;

    if (lower.includes('product') || lower.includes('item') || lower.includes('catalog')) {
      fallbackReply = `At ${botName}, we provide a comprehensive catalog of high-quality offerings with fast delivery and dedicated customer support. Are you looking for a specific item?`;
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('discount')) {
      fallbackReply = `Our pricing packages are structured to offer the best value, with seasonal deals and free shipping on qualifying orders. Would you like our latest pricing breakdown?`;
    } else if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('book') || lower.includes('call')) {
      fallbackReply = `I'd be glad to schedule an appointment for you! We have consultation slots open this week. What day and time works best for your schedule?`;
    } else if (lower.includes('human') || lower.includes('person') || lower.includes('agent') || lower.includes('support')) {
      fallbackReply = `Connecting you to a team specialist right now. One moment while I transfer this conversation to a live representative!`;
    }

    if (upstreamError) {
      // If there was a real error (like invalid key in Admin Panel), we prepend a warning
      fallbackReply = `⚠️ [Backend Error]: ${upstreamError.slice(0, 160)}.\n\n(Simulated Reply): ${fallbackReply}`;
    }

    return NextResponse.json({
      reply: fallbackReply,
      live: false,
      hasKey: false,
      provider: 'simulated'
    });

  } catch (error) {
    console.error('Error in chat API handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
