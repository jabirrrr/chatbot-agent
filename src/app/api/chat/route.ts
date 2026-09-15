import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], provider: requestedProvider, botConfig } = body;
    let apiKey = body.apiKey;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fallback to server environment keys if client didn't supply one
    if (!apiKey) {
      apiKey = (process.env.GEMINI_API_KEY ||
               process.env.GROQ_API_KEY ||
               process.env.OPENROUTER_API_KEY ||
               process.env.OPENAI_API_KEY || '').trim();
    }

    // Determine Provider
    let provider = (requestedProvider || '').toLowerCase();
    const cleanKey = (apiKey || '').trim();

    if (cleanKey.startsWith('AIzaSy')) {
      provider = 'gemini';
    } else if (cleanKey.startsWith('gsk_')) {
      provider = 'groq';
    } else if (cleanKey.startsWith('sk-or-')) {
      provider = 'openrouter';
    } else if (cleanKey.startsWith('sk-ant-')) {
      provider = 'anthropic';
    } else if (!provider) {
      provider = 'openai';
    }

    // Assistant Identity Context
    const botName = botConfig?.name || 'Helio LeadBot';
    const botTone = botConfig?.tone || 'Friendly';
    const botDesc = botConfig?.businessDescription || 'We are an online business providing premium products and services with prompt delivery and support.';
    
    const systemPrompt = `You are ${botName}, a customer support and sales AI assistant.
Tone: ${botTone}.
Business Context: ${botDesc}
Instructions:
- Be concise, helpful, and polite. Keep responses under 2-3 sentences unless more detail is specifically requested.
- Focus on answering questions, capturing lead interest, and offering to schedule or assist further.
- Do not mention you are an external model; speak as the official assistant of ${botName}.`;

    // Normalize message history
    const formattedHistory = history.map((msg: any) => ({
      role: msg.sender === 'visitor' ? 'user' : 'assistant',
      content: msg.content || msg.text || ''
    })).filter((m: any) => m.content);

    // If cleanKey exists and is not the mock placeholder 'sk-mock-openai-key'
    if (cleanKey && cleanKey !== 'sk-mock-openai-key') {
      try {
        let replyText = '';
        let upstreamError = '';

        if (provider.includes('gemini')) {
          // Google Gemini API (native REST)
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;
          const contents = [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nChat History:\n${formattedHistory.map((h: any) => `${h.role}: ${h.content}`).join('\n')}\nuser: ${message}\nassistant:` }]
            }
          ];

          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
            })
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          } else {
            const rawErr = await geminiRes.text();
            console.warn('Gemini API error:', geminiRes.status, rawErr);
            try {
              const parsed = JSON.parse(rawErr);
              upstreamError = parsed.error?.message || rawErr;
            } catch {
              upstreamError = rawErr;
            }
          }
        } else if (provider.includes('anthropic')) {
          // Anthropic Messages API
          const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': cleanKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022',
              system: systemPrompt,
              messages: [...formattedHistory, { role: 'user', content: message }],
              max_tokens: 300,
              temperature: 0.7
            })
          });

          if (anthropicRes.ok) {
            const data = await anthropicRes.json();
            replyText = data.content?.[0]?.text;
          } else {
            const rawErr = await anthropicRes.text();
            console.warn('Anthropic API error:', anthropicRes.status, rawErr);
            try {
              const parsed = JSON.parse(rawErr);
              upstreamError = parsed.error?.message || rawErr;
            } catch {
              upstreamError = rawErr;
            }
          }
        } else {
          // OpenAI / OpenRouter / Groq / OpenAI-compatible endpoint
          let apiUrl = 'https://api.openai.com/v1/chat/completions';
          let model = 'gpt-4o-mini';
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
          };

          if (provider.includes('openrouter')) {
            apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
            model = 'openai/gpt-4o-mini';
            headers['HTTP-Referer'] = 'https://helio.ai';
            headers['X-Title'] = 'Helio Chatbot Platform';
          } else if (provider.includes('groq')) {
            apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
            model = 'llama-3.3-70b-versatile';
          }

          const openAiMessages = [
            { role: 'system', content: systemPrompt },
            ...formattedHistory,
            { role: 'user', content: message }
          ];

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model,
              messages: openAiMessages,
              temperature: 0.7,
              max_tokens: 300,
            })
          });

          if (response.ok) {
            const data = await response.json();
            replyText = data.choices?.[0]?.message?.content;
          } else {
            const rawErr = await response.text();
            console.warn(`LLM ${provider} API error:`, response.status, rawErr);
            try {
              const parsed = JSON.parse(rawErr);
              upstreamError = parsed.error?.message || rawErr;
            } catch {
              upstreamError = rawErr;
            }
          }
        }

        if (replyText) {
          return NextResponse.json({
            reply: replyText.trim(),
            live: true,
            provider
          });
        } else if (upstreamError) {
          return NextResponse.json({
            reply: `⚠️ [${provider.toUpperCase()} API Error]: ${upstreamError.slice(0, 160)}. Please check your API key or billing quota.`,
            live: false,
            error: upstreamError,
            provider
          });
        }
      } catch (callErr: any) {
        console.error('Error during LLM network call:', callErr);
        return NextResponse.json({
          reply: `⚠️ Network error communicating with ${provider} API: ${callErr?.message || 'Connection failed'}.`,
          live: false,
          error: callErr?.message,
          provider
        });
      }
    }

    // Dynamic contextual fallback if no active/valid API key is provided
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
