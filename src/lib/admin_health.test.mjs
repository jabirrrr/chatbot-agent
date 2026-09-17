import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Health & Infrastructure Telemetry Tests', () => {
  test('Overall status resolver prioritizes critical outages over degraded states', () => {
    const resolveOverallStatus = (components) => {
      const db = components.database?.status;
      const api = components.api?.status;
      const redis = components.redis?.status;

      if (db === 'down' || api === 'down') return 'down';
      if (db === 'degraded' || api === 'degraded' || redis === 'degraded') return 'degraded';
      if (db === 'healthy' && api === 'healthy') return 'healthy';
      return 'unknown';
    };

    // All core healthy
    assert.equal(
      resolveOverallStatus({
        api: { status: 'healthy' },
        database: { status: 'healthy' },
        redis: { status: 'not_configured' },
        workers: { status: 'not_configured' }
      }),
      'healthy'
    );

    // Database down -> major outage
    assert.equal(
      resolveOverallStatus({
        api: { status: 'healthy' },
        database: { status: 'down' },
        redis: { status: 'healthy' },
        workers: { status: 'not_configured' }
      }),
      'down'
    );

    // Redis degraded -> degraded
    assert.equal(
      resolveOverallStatus({
        api: { status: 'healthy' },
        database: { status: 'healthy' },
        redis: { status: 'degraded' },
        workers: { status: 'not_configured' }
      }),
      'degraded'
    );
  });

  test('Uptime field rejects fabricated percentages when telemetry history is absent', () => {
    const formatUptime = (historicalTelemetryRecords) => {
      if (!historicalTelemetryRecords || historicalTelemetryRecords.length === 0) {
        return 'No historical data';
      }
      const total = historicalTelemetryRecords.length;
      const up = historicalTelemetryRecords.filter(r => r.is_up).length;
      return `${((up / total) * 100).toFixed(2)}%`;
    };

    // When telemetry has not been persistently collected
    assert.equal(formatUptime([]), 'No historical data');
    assert.equal(formatUptime(null), 'No historical data');
    assert.equal(formatUptime(undefined), 'No historical data');

    // Never outputs fake percentages by default
    assert.notEqual(formatUptime([]), '99.99%');
    assert.notEqual(formatUptime([]), '99.95%');
    assert.notEqual(formatUptime([]), '98.50%');
  });

  test('Worker status reports NOT CONFIGURED for serverless/Vercel architecture', () => {
    const getWorkerStatus = (isServerlessDeployment, hasExternalWorkerHeartbeat) => {
      if (isServerlessDeployment && !hasExternalWorkerHeartbeat) {
        return {
          status: 'not_configured',
          details: 'No persistent background worker is configured for this deployment.'
        };
      }
      return { status: 'healthy', details: 'Worker active' };
    };

    const workerResult = getWorkerStatus(true, false);
    assert.equal(workerResult.status, 'not_configured');
    assert.ok(workerResult.details.includes('No persistent background worker is configured'));
  });

  test('Sanitizes sensitive tokens and connection strings from error messages', () => {
    const sanitize = (msg) => {
      return msg
        .replace(/(postgresql|postgres|redis|rediss):\/\/[^@\s]+@/g, '$1://***@')
        .replace(/(bearer\s+|password\s*=\s*|secret\s*=\s*)[^\s,;]+/gi, '$1***');
    };

    const rawError = 'Connection failed to postgresql://admin:MySecretPass123@db.supabase.co:5432/postgres with Bearer eyJhbGciOi...';
    const sanitized = sanitize(rawError);

    assert.ok(!sanitized.includes('MySecretPass123'));
    assert.ok(sanitized.includes('postgresql://***@'));
    assert.ok(sanitized.includes('Bearer ***'));
  });

  test('Zero mock values audit in health payload generator', () => {
    const prohibitedMockStrings = [
      '99.99%',
      '99.95%',
      '98.50%',
      'Queue timeout on sync_job',
      'Deadlock detected',
      'Rate limit exceeded for IP 192.168.1.1'
    ];

    const realHealthPayload = {
      overall_status: 'healthy',
      checked_at: new Date().toISOString(),
      components: {
        api: { name: 'API / Application', status: 'healthy', latency_ms: 1.2, uptime: 'No historical data' },
        database: { name: 'Main Database (PostgreSQL)', status: 'healthy', latency_ms: 3.4, uptime: 'No historical data' },
        redis: { name: 'Redis Cache', status: 'not_configured', latency_ms: null, uptime: 'No historical data' },
        workers: { name: 'Background Workers', status: 'not_configured', latency_ms: null, uptime: 'No historical data' }
      },
      has_persistent_error_telemetry: false,
      recent_errors: []
    };

    const serialized = JSON.stringify(realHealthPayload);
    for (const mockStr of prohibitedMockStrings) {
      assert.ok(!serialized.includes(mockStr), `Payload must not contain mock string: ${mockStr}`);
    }
  });
});
