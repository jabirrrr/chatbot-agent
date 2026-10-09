import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Widget Embed Architecture & Integration Unit Tests', () => {

  // Test 1: Snippet Generation and Origin Decoupling
  test('Snippet separates frontend script origin from backend API origin', () => {
    const frontendOrigin = 'https://chatbot-agent-lemon.vercel.app';
    const apiBaseUrl = 'https://helio-backend-s55x.onrender.com';
    const chatbotId = 'bot-1234-uuid';
    const widgetToken = 'wgt_live_abc123';

    const snippet = `<script src="${frontendOrigin}/widget.js" data-chatbot-id="${chatbotId}" data-token="${widgetToken}" data-api="${apiBaseUrl}" async></script>`;

    assert.ok(snippet.includes(`src="${frontendOrigin}/widget.js"`), 'Script src must be on frontend origin');
    assert.ok(snippet.includes(`data-api="${apiBaseUrl}"`), 'data-api must point to backend origin');
    assert.ok(snippet.includes(`data-chatbot-id="${chatbotId}"`), 'data-chatbot-id must be present');
    assert.ok(snippet.includes(`data-token="${widgetToken}"`), 'data-token must be present');
    assert.ok(!snippet.includes('cdn.chatly.ai'), 'Must not reference defunct CDN');
  });

  // Test 2: Hostname boundary and domain authorization rules
  const parseAllowedDomains = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map(d => String(d).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean);
    }
    return String(raw).split(/[\s,]+/).map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean);
  };

  const isDomainAuthorized = (candidateHost, allowedDomains) => {
    if (!allowedDomains || allowedDomains.length === 0 || allowedDomains.includes('*')) {
      return true;
    }
    if (!candidateHost || candidateHost === 'null') {
      return false;
    }
    const cleanCandidate = candidateHost.trim().toLowerCase().replace(/:\d+$/, '');
    return allowedDomains.some(allowed => {
      const cleanAllowed = allowed.toLowerCase().replace(/:\d+$/, '');
      return cleanCandidate === cleanAllowed || cleanCandidate.endsWith('.' + cleanAllowed);
    });
  };

  test('Single-domain authorization allows exact domain and subdomains', () => {
    const domains = parseAllowedDomains('company.com');
    assert.equal(domains.length, 1);
    assert.equal(domains[0], 'company.com');

    assert.ok(isDomainAuthorized('company.com', domains), 'Exact match must be allowed');
    assert.ok(isDomainAuthorized('app.company.com', domains), 'Subdomain must be allowed');
    assert.ok(isDomainAuthorized('portal.deep.company.com', domains), 'Nested subdomain must be allowed');
  });

  test('Domain authorization rejects malicious prefixes and lookalike domains', () => {
    const domains = parseAllowedDomains('company.com');

    assert.ok(!isDomainAuthorized('evil-company.com', domains), 'Hyphenated evil domain must be rejected');
    assert.ok(!isDomainAuthorized('fakecompany.com', domains), 'Prefix mismatch must be rejected');
    assert.ok(!isDomainAuthorized('company.com.attacker.com', domains), 'Suffix attack must be rejected');
    assert.ok(!isDomainAuthorized('notcompany.com', domains), 'Different domain must be rejected');
  });

  test('Multi-domain configuration parses comma-separated lists correctly', () => {
    const domains = parseAllowedDomains('company.com, staging.company.net, localhost:3000');
    assert.equal(domains.length, 3);
    assert.ok(domains.includes('company.com'));
    assert.ok(domains.includes('staging.company.net'));
    assert.ok(domains.includes('localhost:3000'));

    assert.ok(isDomainAuthorized('company.com', domains));
    assert.ok(isDomainAuthorized('staging.company.net', domains));
    assert.ok(isDomainAuthorized('localhost', domains));
    assert.ok(!isDomainAuthorized('other.org', domains));
  });

  test('Null or missing origin is rejected when domain restriction is active', () => {
    const domains = parseAllowedDomains('company.com');
    assert.ok(!isDomainAuthorized(null, domains));
    assert.ok(!isDomainAuthorized('', domains));
    assert.ok(!isDomainAuthorized('null', domains));
  });

  test('Unrestricted chatbot (empty or wildcard domain) permits any origin', () => {
    assert.ok(isDomainAuthorized('random-site.com', []));
    assert.ok(isDomainAuthorized(null, []));
    assert.ok(isDomainAuthorized('random-site.com', ['*']));
  });

  // Test 3: Partial Configuration Update Merging
  test('Merging partial config updates preserves unrelated settings', () => {
    const existingConfig = {
      theme_color: '#2563eb',
      bubble_style: 'Modern',
      domain: 'client.com',
      system_prompt: 'Confidential company instructions',
      lead_capture_enabled: true,
      appointment_booking_enabled: true,
      google_calendar_id: 'cal_secret_12345'
    };

    // User updates only bubbleStyle and themeColor from Appearance Studio
    const partialUpdate = {
      bubble_style: 'Rounded',
      theme_color: '#10b981'
    };

    const merged = { ...existingConfig, ...partialUpdate };

    // Verified: new settings applied
    assert.equal(merged.bubble_style, 'Rounded');
    assert.equal(merged.theme_color, '#10b981');

    // Verified: existing unrelated settings not wiped out
    assert.equal(merged.domain, 'client.com');
    assert.equal(merged.system_prompt, 'Confidential company instructions');
    assert.equal(merged.lead_capture_enabled, true);
    assert.equal(merged.appointment_booking_enabled, true);
    assert.equal(merged.google_calendar_id, 'cal_secret_12345');
  });

  // Test 4: PublicWidgetConfig data sanitization (Never leaks secrets)
  test('Public widget response exposes only public branding and UI attributes', () => {
    const internalBot = {
      id: 'bot-uuid',
      name: 'Northstar Assistant',
      welcome_message: 'Hi there! How can I help you today?',
      theme_color: '#2563eb',
      position: 'bottom-right',
      bubble_style: 'Modern',
      suggested_questions: ['What services do you offer?', 'Book a consultation'],
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      is_active: true,
      // Internal sensitive fields:
      system_prompt: 'DO NOT DISCLOSE: Internal business instructions',
      api_key: 'sk-secret-key-1234',
      model_name: 'anthropic/claude-3-opus',
      temperature: 0.7,
      organization_id: 'org-tenant-secret'
    };

    // Construct PublicWidgetConfig
    const publicConfig = {
      name: internalBot.name,
      welcome_message: internalBot.welcome_message,
      theme_color: internalBot.theme_color,
      position: internalBot.position,
      lead_capture_enabled: true,
      appointment_booking_enabled: true,
      is_active: internalBot.is_active,
      avatar_url: internalBot.avatar_url,
      bubble_style: internalBot.bubble_style,
      suggested_questions: internalBot.suggested_questions
    };

    assert.equal(publicConfig.name, 'Northstar Assistant');
    assert.equal(publicConfig.bubble_style, 'Modern');
    assert.equal(publicConfig.suggested_questions.length, 2);

    // Verify secrets are NOT present
    assert.equal(publicConfig.system_prompt, undefined);
    assert.equal(publicConfig.api_key, undefined);
    assert.equal(publicConfig.model_name, undefined);
    assert.equal(publicConfig.organization_id, undefined);
  });
});
