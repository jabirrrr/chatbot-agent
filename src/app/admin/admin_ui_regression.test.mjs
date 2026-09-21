import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Admin UI Regression Tests: Ensure mock data is removed and BACKEND NOT IMPLEMENTED is shown', async (t) => {
  const pages = [
    { name: 'Overview', path: 'src/app/admin/page.tsx' },
    { name: 'Users', path: 'src/app/admin/users/page.tsx' },
    { name: 'Analytics', path: 'src/app/admin/analytics/page.tsx' },
    { name: 'API Settings', path: 'src/app/admin/api-settings/page.tsx' },
    { name: 'Settings', path: 'src/app/admin/settings/page.tsx' }
  ];

  for (const page of pages) {
    await t.test('Page ' + page.name + ' does NOT contain BACKEND NOT IMPLEMENTED state', () => {
      const content = fs.readFileSync(path.resolve(process.cwd(), page.path), 'utf-8');
      assert.ok(!content.includes('BACKEND NOT IMPLEMENTED'), 'Should not contain BACKEND NOT IMPLEMENTED anymore');
    });
  }
});