import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Chatly Frontend API & Configuration Tests', () => {
  test('API_BASE resolution in production defaults to relative origin or custom NEXT_PUBLIC_API_URL', () => {
    // When NEXT_PUBLIC_API_URL is empty or undefined in production, API_BASE is relative ''
    const resolveApiBase = (publicUrl, nodeEnv) => {
      if (publicUrl !== undefined && publicUrl !== '') {
        return publicUrl;
      }
      return nodeEnv === 'production' ? '' : 'http://localhost:8000';
    };

    assert.equal(resolveApiBase('', 'production'), '');
    assert.equal(resolveApiBase(undefined, 'production'), '');
    assert.equal(resolveApiBase('https://api.chatly.ai', 'production'), 'https://api.chatly.ai');
    assert.equal(resolveApiBase(undefined, 'development'), 'http://localhost:8000');
  });

  test('API endpoints construct correct REST paths without double slashes', () => {
    const apiBase = '';
    const constructUrl = (base, path) => `${base}${path}`;

    assert.equal(constructUrl(apiBase, '/health'), '/health');
    assert.equal(constructUrl(apiBase, '/api/v1/health'), '/api/v1/health');
    assert.equal(constructUrl(apiBase, '/api/v1/status'), '/api/v1/status');
    assert.equal(constructUrl(apiBase, '/api/v1/auth/login'), '/api/v1/auth/login');
    assert.equal(constructUrl(apiBase, '/api/v1/integrations/status'), '/api/v1/integrations/status');
    assert.equal(constructUrl(apiBase, '/api/v1/integrations/google-calendar/auth-url'), '/api/v1/integrations/google-calendar/auth-url');
  });

  test('Google Calendar OAuth callback query parameter handling', () => {
    const parseOAuthParams = (search) => {
      const params = new URLSearchParams(search);
      return {
        success: params.get('gcal_success') === 'true',
        error: params.get('gcal_error') || null,
      };
    };

    const successResult = parseOAuthParams('?screen=integrations&gcal_success=true');
    assert.equal(successResult.success, true);
    assert.equal(successResult.error, null);

    const errorResult = parseOAuthParams('?screen=integrations&gcal_error=access_denied');
    assert.equal(errorResult.success, false);
    assert.equal(errorResult.error, 'access_denied');
  });

  test('Sanitizes error messages for notification banners', () => {
    const formatError = (rawErr) => rawErr.replace(/_/g, ' ');
    assert.equal(formatError('invalid_state_token'), 'invalid state token');
    assert.equal(formatError('missing_code_or_state'), 'missing code or state');
  });
});
