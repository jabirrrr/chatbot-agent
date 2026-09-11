/**
 * Helio Autonomous AI Chatbot - Universal Embed Widget Runtime
 * Version: 1.0.0
 * Encapsulated via Shadow DOM for zero host-CSS collision.
 */
(function () {
  const currentScript = document.currentScript || document.querySelector('script[data-token]');
  if (!currentScript) return;

  const WIDGET_TOKEN = currentScript.getAttribute('data-token');
  const API_BASE = currentScript.getAttribute('data-api') || window.location.origin;

  if (!WIDGET_TOKEN) {
    console.error('[Helio Widget] Error: data-token attribute is required on script tag.');
    return;
  }

  const STORAGE_KEY_SESSION = `helio_session_${WIDGET_TOKEN}`;
  const STORAGE_KEY_VISITOR = `helio_visitor_id`;

  let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR);
  if (!visitorId) {
    visitorId = 'vis_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
  }

  let sessionToken = localStorage.getItem(STORAGE_KEY_SESSION) || null;
  let config = null;
  let isOpen = false;
  let isStreaming = false;

  // Create Host Container & Attach Shadow DOM
  const container = document.createElement('div');
  container.id = 'helio-widget-root';
  document.body.appendChild(container);
  const shadow = container.attachShadow({ mode: 'open' });

  // Stylesheet
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .helio-launcher {
      position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px; border-radius: 30px;
      background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18); cursor: pointer; z-index: 999999;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .helio-launcher:hover { transform: scale(1.06); }
    .helio-launcher svg { width: 28px; height: 28px; fill: currentColor; }
    
    .helio-window {
      position: fixed; bottom: 96px; right: 24px; width: 380px; height: 600px; max-height: calc(100vh - 120px);
      background: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.16);
      display: flex; flex-direction: column; overflow: hidden; z-index: 999999;
      border: 1px solid rgba(0,0,0,0.08); transition: all 0.25s ease;
      opacity: 0; pointer-events: none; transform: translateY(12px) scale(0.96);
    }
    .helio-window.open {
      opacity: 1; pointer-events: auto; transform: translateY(0) scale(1);
    }
    @media (max-width: 480px) {
      .helio-window { bottom: 0; right: 0; width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
    }
    .helio-header {
      padding: 16px 20px; background: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: space-between;
    }
    .helio-header-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .helio-status-dot { width: 8px; height: 8px; border-radius: 4px; background: #34d399; }
    .helio-close-btn { cursor: pointer; background: transparent; border: none; color: #ffffff; opacity: 0.8; }
    .helio-close-btn:hover { opacity: 1; }

    .helio-messages {
      flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
      background: #f8fafc;
    }
    .helio-msg {
      max-width: 82%; padding: 12px 16px; border-radius: 14px; font-size: 14px; line-height: 1.45; word-break: break-word;
    }
    .helio-msg-bot {
      background: #ffffff; color: #1e293b; align-self: flex-start; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px;
    }
    .helio-msg-visitor {
      background: #2563eb; color: #ffffff; align-self: flex-end; border-bottom-right-radius: 4px;
    }
    .helio-lead-badge {
      align-self: center; font-size: 12px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
      padding: 6px 12px; border-radius: 20px; font-weight: 500; display: flex; align-items: center; gap: 6px;
    }
    .helio-typing {
      display: inline-block; width: 6px; height: 6px; border-radius: 3px; background: #94a3b8;
      animation: helioPulse 1s infinite alternate; margin-right: 4px;
    }
    @keyframes helioPulse { 0% { opacity: 0.2; } 100% { opacity: 1; } }

    .helio-footer {
      padding: 14px 16px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;
    }
    .helio-input {
      flex: 1; border: 1px solid #cbd5e1; border-radius: 24px; padding: 10px 16px; font-size: 14px;
      outline: none; transition: border-color 0.2s;
    }
    .helio-input:focus { border-color: #2563eb; }
    .helio-send-btn {
      width: 40px; height: 40px; border-radius: 20px; border: none; background: #2563eb; color: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
    }
    .helio-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  shadow.appendChild(style);

  // Widget Launcher Button
  const launcher = document.createElement('div');
  launcher.className = 'helio-launcher';
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
  `;
  shadow.appendChild(launcher);

  // Widget Window
  const win = document.createElement('div');
  win.className = 'helio-window';
  win.innerHTML = `
    <div class="helio-header">
      <div class="helio-header-title">
        <span class="helio-status-dot"></span>
        <span id="helio-bot-name">Helio Assistant</span>
      </div>
      <button class="helio-close-btn" id="helio-close">✕</button>
    </div>
    <div class="helio-messages" id="helio-msg-list"></div>
    <div class="helio-footer">
      <input type="text" class="helio-input" id="helio-input" placeholder="Type your message..." />
      <button class="helio-send-btn" id="helio-send">➔</button>
    </div>
  `;
  shadow.appendChild(win);

  const msgList = win.querySelector('#helio-msg-list');
  const input = win.querySelector('#helio-input');
  const sendBtn = win.querySelector('#helio-send');
  const closeBtn = win.querySelector('#helio-close');
  const botNameEl = win.querySelector('#helio-bot-name');

  function appendMessage(sender, text) {
    const el = document.createElement('div');
    el.className = `helio-msg helio-msg-${sender}`;
    el.textContent = text;
    msgList.appendChild(el);
    msgList.scrollTop = msgList.scrollHeight;
    return el;
  }

  function appendLeadBadge(name) {
    const el = document.createElement('div');
    el.className = 'helio-lead-badge';
    el.textContent = `✓ Details captured for ${name}`;
    msgList.appendChild(el);
    msgList.scrollTop = msgList.scrollHeight;
  }

  // Fetch Configuration & Initialize Session
  async function init() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/widget/config?token=${encodeURIComponent(WIDGET_TOKEN)}`);
      if (!res.ok) return;
      config = await res.json();

      botNameEl.textContent = config.name;
      if (config.theme_color) {
        launcher.style.background = config.theme_color;
        win.querySelector('.helio-header').style.background = config.theme_color;
        sendBtn.style.background = config.theme_color;
      }
      if (config.position === 'bottom-left') {
        launcher.style.left = '24px';
        launcher.style.right = 'auto';
        win.style.left = '24px';
        win.style.right = 'auto';
      }

      // Start or recover conversation session
      const sRes = await fetch(`${API_BASE}/api/v1/widget/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widget_token: WIDGET_TOKEN, visitor_id: visitorId })
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        sessionToken = sData.session_token;
        localStorage.setItem(STORAGE_KEY_SESSION, sessionToken);

        // Load existing messages or show welcome
        if (sData.messages && sData.messages.length > 0) {
          sData.messages.forEach(m => appendMessage(m.sender_type, m.content));
        } else if (config.welcome_message) {
          appendMessage('bot', config.welcome_message);
        }
      }
    } catch (e) {
      console.warn('[Helio Widget] Offline or initialization error:', e);
    }
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isStreaming || !sessionToken) return;

    input.value = '';
    appendMessage('visitor', text);
    isStreaming = true;
    sendBtn.disabled = true;

    const botMsgEl = appendMessage('bot', '');

    try {
      const response = await fetch(`${API_BASE}/api/v1/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken, message: text })
      });

      if (!response.ok) {
        botMsgEl.textContent = "Sorry, I am having trouble connecting right now.";
        isStreaming = false;
        sendBtn.disabled = false;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep incomplete tail

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.substring(6));
            if (event.event === 'delta') {
              botMsgEl.textContent += event.data;
              msgList.scrollTop = msgList.scrollHeight;
            } else if (event.event === 'lead_captured') {
              appendLeadBadge(event.data.name);
            }
          } catch (err) {}
        }
      }
    } catch (err) {
      botMsgEl.textContent = "Connection interrupted. Please try again.";
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
    }
  }

  launcher.addEventListener('click', () => {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    win.classList.remove('open');
  });

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  init();
})();
