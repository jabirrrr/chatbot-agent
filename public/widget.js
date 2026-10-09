/**
 * Helio Autonomous AI Chatbot - Universal Embed Widget Runtime
 * Version: 2.0.0
 * Encapsulated via Shadow DOM for zero host-CSS collision.
 */
(function () {
  const currentScript = document.currentScript || document.querySelector('script[data-chatbot-id], script[data-token], script[data-chatly-id]');
  if (!currentScript) return;

  const WIDGET_TOKEN = currentScript.getAttribute('data-chatbot-id') || currentScript.getAttribute('data-token') || currentScript.getAttribute('data-chatly-id');
  const API_BASE = currentScript.getAttribute('data-api') || new URL(currentScript.src).origin;

  if (!WIDGET_TOKEN) {
    console.error('[Helio Widget] Error: data-chatbot-id or data-token attribute is required on script tag.');
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
      box-shadow: 0 4px 16px rgba(0,0,0,0.18); cursor: pointer; z-index: 999999;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
    }
    .helio-launcher:hover { transform: scale(1.06); box-shadow: 0 6px 20px rgba(0,0,0,0.22); }
    .helio-launcher svg { width: 26px; height: 26px; fill: currentColor; }
    
    .helio-window {
      position: fixed; bottom: 96px; right: 24px; width: 380px; height: 600px; max-height: calc(100vh - 120px);
      background: #ffffff; border-radius: 18px; box-shadow: 0 12px 36px rgba(0,0,0,0.16);
      display: flex; flex-direction: column; overflow: hidden; z-index: 999999;
      border: 1px solid rgba(0,0,0,0.08); transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0; pointer-events: none; transform: translateY(12px) scale(0.97);
    }
    .helio-window.open {
      opacity: 1; pointer-events: auto; transform: translateY(0) scale(1);
    }
    @media (max-width: 480px) {
      .helio-window { bottom: 0; right: 0; left: 0 !important; width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
      .helio-launcher { bottom: 16px; right: 16px; }
    }
    .helio-header {
      padding: 14px 18px; background: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); flex-shrink: 0;
    }
    .helio-header-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    .helio-header-avatar {
      width: 32px; height: 32px; border-radius: 16px; background: rgba(255,255,255,0.25);
      background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center;
      border: 1.5px solid rgba(255,255,255,0.4); flex-shrink: 0;
    }
    .helio-status-badge {
      display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 400; opacity: 0.9;
    }
    .helio-status-dot {
      width: 7px; height: 7px; border-radius: 4px; background: #34d399; box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
    }
    .helio-header-actions { display: flex; align-items: center; gap: 6px; }
    .helio-icon-btn {
      cursor: pointer; background: transparent; border: none; color: #ffffff; opacity: 0.85;
      padding: 4px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, opacity 0.15s;
    }
    .helio-icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.18); }

    .helio-messages {
      flex: 1; padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
      background: #f8fafc;
    }
    .helio-msg-wrapper {
      display: flex; align-items: flex-end; gap: 8px; max-width: 86%;
    }
    .helio-msg-wrapper.bot { align-self: flex-start; }
    .helio-msg-wrapper.visitor { align-self: flex-end; flex-direction: row-reverse; }
    .helio-avatar {
      width: 26px; height: 26px; border-radius: 13px; background: #e2e8f0; 
      flex-shrink: 0; background-size: cover; background-position: center;
      display: flex; align-items: center; justify-content: center;
    }
    .helio-msg {
      padding: 10px 14px; font-size: 13px; line-height: 1.5; word-break: break-word; white-space: pre-wrap;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .helio-msg-bot {
      background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0;
    }
    .helio-msg-visitor {
      background: #2563eb; color: #ffffff;
    }

    .helio-quick-replies {
      display: flex; flex-direction: column; gap: 6px; padding-top: 4px; align-self: flex-start; max-width: 90%;
    }
    .helio-quick-btn {
      background: #ffffff; border: 1px solid #e2e8f0; color: #2563eb; padding: 6px 12px;
      border-radius: 16px; font-size: 12px; font-weight: 500; cursor: pointer; text-align: left;
      transition: background 0.15s, border-color 0.15s; width: fit-content;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .helio-quick-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }

    .helio-lead-badge {
      align-self: center; font-size: 11px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;
      padding: 5px 10px; border-radius: 20px; font-weight: 500; display: flex; align-items: center; gap: 5px;
    }
    .helio-typing-indicator {
      display: flex; gap: 4px; padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; 
      align-items: center; height: 38px;
    }
    .helio-typing-dot {
      width: 5px; height: 5px; border-radius: 3px; background: #94a3b8;
      animation: helioTyping 1.4s infinite ease-in-out both;
    }
    .helio-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .helio-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes helioTyping {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .helio-error-banner {
      background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; padding: 10px 14px;
      border-radius: 12px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;
    }
    .helio-retry-btn {
      background: #e11d48; color: #fff; border: none; padding: 4px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 600; cursor: pointer; width: fit-content;
    }
    .helio-retry-btn:hover { background: #be123c; }

    .helio-footer {
      padding: 12px 14px; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;
      align-items: center; flex-shrink: 0;
    }
    .helio-input {
      flex: 1; border: 1px solid #cbd5e1; border-radius: 20px; padding: 9px 14px; font-size: 13px;
      outline: none; transition: border-color 0.15s, box-shadow 0.15s; background: #f8fafc;
    }
    .helio-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
    .helio-input:disabled { opacity: 0.6; cursor: not-allowed; }
    .helio-send-btn {
      width: 36px; height: 36px; border-radius: 18px; border: none; background: #2563eb; color: #fff;
      display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
      transition: opacity 0.15s, transform 0.1s;
    }
    .helio-send-btn:hover:not(:disabled) { transform: scale(1.05); }
    .helio-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .helio-branding {
      text-align: center; font-size: 10px; color: #94a3b8; padding: 4px; background: #f8fafc; border-top: 1px solid #f1f5f9;
    }
  `;
  shadow.appendChild(style);

  // Widget Launcher Button
  const launcher = document.createElement('div');
  launcher.className = 'helio-launcher';
  launcher.setAttribute('aria-label', 'Open Chat Widget');
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
        <div class="helio-header-avatar" id="helio-header-avatar">
          <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#ffffff"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>
        </div>
        <div>
          <div id="helio-bot-name">Helio Assistant</div>
          <div class="helio-status-badge">
            <span class="helio-status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
      <div class="helio-header-actions">
        <button class="helio-icon-btn" id="helio-close" aria-label="Close Chat">
          <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    <div class="helio-messages" id="helio-msg-list"></div>
    <div class="helio-footer">
      <input type="text" class="helio-input" id="helio-input" placeholder="Type your message..." />
      <button class="helio-send-btn" id="helio-send" aria-label="Send Message">
        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
    <div class="helio-branding">Powered by Helio</div>
  `;
  shadow.appendChild(win);

  const msgList = win.querySelector('#helio-msg-list');
  const input = win.querySelector('#helio-input');
  const sendBtn = win.querySelector('#helio-send');
  const closeBtn = win.querySelector('#helio-close');
  const botNameEl = win.querySelector('#helio-bot-name');
  const headerAvatarEl = win.querySelector('#helio-header-avatar');

  function getBubbleRadius(sender, styleType) {
    const isBot = sender === 'bot';
    switch (styleType) {
      case 'Minimal':
        return '6px';
      case 'Rounded':
        return isBot ? '22px 22px 22px 6px' : '22px 22px 6px 22px';
      case 'Classic':
        return '12px';
      case 'Modern':
      default:
        return isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px';
    }
  }

  function appendMessage(sender, text) {
    const wrapper = document.createElement('div');
    wrapper.className = `helio-msg-wrapper ${sender}`;

    if (sender === 'bot') {
      const avatar = document.createElement('div');
      avatar.className = 'helio-avatar';
      if (config && config.avatar_url) {
        avatar.style.backgroundImage = `url(${config.avatar_url})`;
      } else {
        avatar.innerHTML = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:#64748b"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>`;
      }
      wrapper.appendChild(avatar);
    }

    const msg = document.createElement('div');
    msg.className = `helio-msg helio-msg-${sender}`;
    msg.textContent = text;

    const bubbleStyle = (config && config.bubble_style) || 'Modern';
    msg.style.borderRadius = getBubbleRadius(sender, bubbleStyle);

    if (sender === 'visitor' && config && config.theme_color) {
      msg.style.backgroundColor = config.theme_color;
      msg.style.color = '#ffffff';
    }

    wrapper.appendChild(msg);
    msgList.appendChild(wrapper);
    msgList.scrollTop = msgList.scrollHeight;
    return msg;
  }

  function appendQuickReplies(questions) {
    if (!questions || !questions.length) return;
    const container = document.createElement('div');
    container.className = 'helio-quick-replies';
    container.id = 'helio-quick-container';

    questions.forEach((q) => {
      const btn = document.createElement('button');
      btn.className = 'helio-quick-btn';
      btn.textContent = q;
      if (config && config.theme_color) {
        btn.style.color = config.theme_color;
      }
      btn.addEventListener('click', () => {
        container.remove();
        sendMessageWithText(q);
      });
      container.appendChild(btn);
    });

    msgList.appendChild(container);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function appendTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = `helio-msg-wrapper bot`;
    wrapper.id = 'helio-typing-wrapper';

    const avatar = document.createElement('div');
    avatar.className = 'helio-avatar';
    if (config && config.avatar_url) {
      avatar.style.backgroundImage = `url(${config.avatar_url})`;
    } else {
      avatar.innerHTML = `<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:#64748b"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-1H1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>`;
    }
    wrapper.appendChild(avatar);

    const typing = document.createElement('div');
    typing.className = 'helio-typing-indicator';
    typing.style.borderRadius = getBubbleRadius('bot', (config && config.bubble_style) || 'Modern');
    typing.innerHTML = '<div class="helio-typing-dot"></div><div class="helio-typing-dot"></div><div class="helio-typing-dot"></div>';
    wrapper.appendChild(typing);

    msgList.appendChild(wrapper);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = msgList.querySelector('#helio-typing-wrapper');
    if (el) el.remove();
  }

  function appendLeadBadge(name) {
    const el = document.createElement('div');
    el.className = 'helio-lead-badge';
    el.textContent = `✓ Details captured for ${name}`;
    msgList.appendChild(el);
    msgList.scrollTop = msgList.scrollHeight;
  }

  function showError(msg) {
    const banner = document.createElement('div');
    banner.className = 'helio-error-banner';
    banner.innerHTML = `
      <div><strong>Connection Notice:</strong> ${msg}</div>
      <button class="helio-retry-btn" id="helio-retry-action">Retry Connection</button>
    `;
    const retryBtn = banner.querySelector('#helio-retry-action');
    retryBtn.addEventListener('click', () => {
      banner.remove();
      init();
    });
    msgList.appendChild(banner);
    msgList.scrollTop = msgList.scrollHeight;
  }

  // Fetch Configuration & Initialize Session
  async function init() {
    try {
      msgList.innerHTML = '';
      input.disabled = false;
      sendBtn.disabled = false;

      const res = await fetch(`${API_BASE}/api/v1/widget/config?token=${encodeURIComponent(WIDGET_TOKEN)}`);
      if (!res.ok) {
        if (res.status === 403) {
          showError('Embedding unauthorized: This domain is not authorized for this chatbot.');
        } else {
          showError('Chatbot is temporarily offline or unconfigured.');
        }
        input.disabled = true;
        sendBtn.disabled = true;
        return;
      }
      config = await res.json();

      botNameEl.textContent = config.name || 'Helio Assistant';
      if (config.avatar_url) {
        headerAvatarEl.style.backgroundImage = `url(${config.avatar_url})`;
        headerAvatarEl.innerHTML = '';
      }

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
          if (config.suggested_questions && config.suggested_questions.length > 0) {
            appendQuickReplies(config.suggested_questions);
          }
        }
      } else {
        if (sRes.status === 403) {
          showError('Domain unauthorized for this conversation session.');
        } else {
          showError('Failed to initialize conversation session.');
        }
        input.disabled = true;
        sendBtn.disabled = true;
      }
    } catch (e) {
      console.warn('[Helio Widget] Initialization error:', e);
      showError('Chatbot is unreachable. Check network connection.');
      input.disabled = true;
      sendBtn.disabled = true;
    }
  }

  async function sendMessageWithText(text) {
    if (!text || isStreaming || !sessionToken) return;

    // Remove existing quick replies if clicked
    const qCont = msgList.querySelector('#helio-quick-container');
    if (qCont) qCont.remove();

    appendMessage('visitor', text);
    appendTypingIndicator();
    isStreaming = true;
    sendBtn.disabled = true;
    input.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/api/v1/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken, message: text })
      });

      if (!response.ok) {
        removeTypingIndicator();
        if (response.status === 403) {
          showError("Message rejected: Domain unauthorized.");
        } else {
          appendMessage('bot', "Sorry, I am having trouble connecting right now.");
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let botMsgEl = null;

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
              if (!botMsgEl) {
                removeTypingIndicator();
                botMsgEl = appendMessage('bot', '');
              }
              botMsgEl.textContent += event.data;
              msgList.scrollTop = msgList.scrollHeight;
            } else if (event.event === 'lead_captured') {
              appendLeadBadge(event.data.name);
            }
          } catch (err) {}
        }
      }
    } catch (err) {
      removeTypingIndicator();
      appendMessage('bot', "Connection interrupted. Please try again.");
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendMessageWithText(text);
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  init();
})();
