import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Live System Logs Unit Tests', () => {
  test('Exponential backoff calculation caps at 30 seconds', () => {
    const calculateBackoff = (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000);

    assert.equal(calculateBackoff(0), 1000);
    assert.equal(calculateBackoff(1), 2000);
    assert.equal(calculateBackoff(2), 4000);
    assert.equal(calculateBackoff(3), 8000);
    assert.equal(calculateBackoff(4), 16000);
    assert.equal(calculateBackoff(5), 30000); // capped at 30s
    assert.equal(calculateBackoff(10), 30000); // stays capped
  });

  test('UI ring buffer caps at 300 entries to prevent DOM bloating', () => {
    const MAX_UI_LOGS = 300;
    const appendLog = (prev, newEntry) => {
      const next = [...prev, newEntry];
      return next.length > MAX_UI_LOGS ? next.slice(-MAX_UI_LOGS) : next;
    };

    let buffer = [];
    for (let i = 0; i < 350; i++) {
      buffer = appendLog(buffer, { id: `log-${i}`, message: `Event ${i}` });
    }

    assert.equal(buffer.length, 300);
    assert.equal(buffer[0].id, 'log-50');
    assert.equal(buffer[299].id, 'log-349');
  });

  test('Filter logic accurately filters by level, source, and search query', () => {
    const logs = [
      { id: '1', level: 'INFO', source: 'API', message: 'HTTP 200 GET /api/v1/users', request_path: '/api/v1/users', user_id: 'usr-1' },
      { id: '2', level: 'WARNING', source: 'AUTH', message: 'Failed login attempt for test@user.com', request_path: '/api/v1/auth/login', user_id: null },
      { id: '3', level: 'ERROR', source: 'DATABASE', message: 'Query connection timeout', request_path: null, user_id: 'usr-2' },
      { id: '4', level: 'CRITICAL', source: 'SYSTEM', message: 'Kernel out of memory', request_path: null, user_id: null },
    ];

    const filterLogs = (list, level, source, query) => {
      return list.filter((log) => {
        if (level !== 'ALL' && log.level !== level) return false;
        if (source !== 'ALL' && log.source !== source) return false;
        if (query) {
          const q = query.toLowerCase();
          const inMsg = log.message.toLowerCase().includes(q);
          const inPath = log.request_path ? log.request_path.toLowerCase().includes(q) : false;
          const inUser = log.user_id ? log.user_id.toLowerCase().includes(q) : false;
          if (!inMsg && !inPath && !inUser) return false;
        }
        return true;
      });
    };

    // Filter by Level
    assert.equal(filterLogs(logs, 'ERROR', 'ALL', '').length, 1);
    assert.equal(filterLogs(logs, 'ERROR', 'ALL', '')[0].id, '3');

    // Filter by Source
    assert.equal(filterLogs(logs, 'ALL', 'AUTH', '').length, 1);
    assert.equal(filterLogs(logs, 'ALL', 'AUTH', '')[0].id, '2');

    // Filter by Search (message)
    assert.equal(filterLogs(logs, 'ALL', 'ALL', 'timeout').length, 1);

    // Filter by Search (path)
    assert.equal(filterLogs(logs, 'ALL', 'ALL', '/users').length, 1);

    // Filter by Search (user_id)
    assert.equal(filterLogs(logs, 'ALL', 'ALL', 'usr-2').length, 1);
  });

  test('Degraded mode status message accurately reflects Redis Pub/Sub absence', () => {
    const resolveStatusMessage = (redisConnected, notice) => {
      if (notice) return notice;
      return redisConnected
        ? 'Logs are synchronized across backend replicas via Redis Pub/Sub.'
        : 'Redis Pub/Sub is unavailable. Live events and history reflect only this backend process and are not shared across serverless/scaled replicas.';
    };

    const connectedMsg = resolveStatusMessage(true, '');
    assert.ok(connectedMsg.includes('synchronized'));

    const degradedMsg = resolveStatusMessage(false, '');
    assert.ok(degradedMsg.includes('Redis Pub/Sub is unavailable'));
  });

  test('Auth expiration (401/403) terminates reconnection loop', () => {
    const handleStreamResponse = (status) => {
      if (status === 401 || status === 403) {
        return { shouldReconnect: false, error: 'Authentication required or session expired.' };
      }
      if (status === 429) {
        return { shouldReconnect: true, error: 'Concurrency limit reached.' };
      }
      if (status === 200) {
        return { shouldReconnect: true, error: null };
      }
      return { shouldReconnect: true, error: 'Connection error' };
    };

    assert.equal(handleStreamResponse(401).shouldReconnect, false);
    assert.equal(handleStreamResponse(403).shouldReconnect, false);
    assert.equal(handleStreamResponse(429).shouldReconnect, true);
    assert.equal(handleStreamResponse(500).shouldReconnect, true);
  });
});
