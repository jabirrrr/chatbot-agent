import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllTimezones,
  searchTimezones,
  groupTimezonesByRegion,
  normalizeIanaTimezone,
  getTimezoneInfo,
  getBrowserTimezone,
  ORDERED_REGIONS
} from './timezones.ts';

describe('Chatly IANA Timezone Picker & Utility Tests', () => {
  test('getAllTimezones returns complete IANA timezone database (>400 zones)', () => {
    const timezones = getAllTimezones();
    assert.ok(timezones.length >= 400, `Expected at least 400 timezones, got ${timezones.length}`);
    
    // Key canonical & aliased timezones must exist
    const kolkata = timezones.find(tz => tz.iana === 'Asia/Kolkata');
    assert.ok(kolkata, 'Asia/Kolkata must be in timezone list');
    assert.equal(kolkata.region, 'Asia');
    assert.ok(kolkata.city.includes('Kolkata'));
    assert.equal(kolkata.offset, 'UTC+05:30');

    const newYork = timezones.find(tz => tz.iana === 'America/New_York');
    assert.ok(newYork, 'America/New_York must be in timezone list');
    assert.equal(newYork.region, 'America');
    assert.ok(newYork.offset.startsWith('UTC-04:') || newYork.offset.startsWith('UTC-05:'));

    const london = timezones.find(tz => tz.iana === 'Europe/London');
    assert.ok(london, 'Europe/London must be in timezone list');
    assert.equal(london.region, 'Europe');
  });

  test('searchTimezones finds timezones by country, city, abbreviation, or IANA name', () => {
    // 1. Search "India" -> matches Asia/Kolkata
    const indiaResults = searchTimezones('India');
    assert.ok(indiaResults.length > 0);
    assert.ok(indiaResults.some(tz => tz.iana === 'Asia/Kolkata'));

    // 2. Search "New York" -> matches America/New_York
    const nyResults = searchTimezones('New York');
    assert.ok(nyResults.length > 0);
    assert.equal(nyResults[0].iana, 'America/New_York');

    // 3. Search "London" -> matches Europe/London
    const londonResults = searchTimezones('London');
    assert.ok(londonResults.length > 0);
    assert.ok(londonResults.some(tz => tz.iana === 'Europe/London'));

    // 4. Search "Tokyo" -> matches Asia/Tokyo
    const tokyoResults = searchTimezones('Tokyo');
    assert.ok(tokyoResults.length > 0);
    assert.ok(tokyoResults.some(tz => tz.iana === 'Asia/Tokyo'));

    // 5. Search "Kolkata" -> matches Asia/Kolkata
    const kolkataResults = searchTimezones('Kolkata');
    assert.ok(kolkataResults.length > 0);
    assert.ok(kolkataResults.some(tz => tz.iana === 'Asia/Kolkata'));
  });

  test('groupTimezonesByRegion organizes results into standard geographic regions', () => {
    const all = getAllTimezones();
    const grouped = groupTimezonesByRegion(all);

    const requiredRegions = [
      'Africa',
      'America',
      'Antarctica',
      'Asia',
      'Atlantic',
      'Australia',
      'Europe',
      'Indian',
      'Pacific'
    ];

    for (const region of requiredRegions) {
      const group = grouped.find(g => g.region === region);
      assert.ok(group, `Region ${region} must exist in grouped results`);
      assert.ok(group.timezones.length > 0, `Region ${region} must not be empty`);
    }

    const asiaGroup = grouped.find(g => g.region === 'Asia');
    assert.ok(asiaGroup.timezones.some(tz => tz.iana === 'Asia/Kolkata'));

    const americaGroup = grouped.find(g => g.region === 'America');
    assert.ok(americaGroup.timezones.some(tz => tz.iana === 'America/New_York'));

    const europeGroup = grouped.find(g => g.region === 'Europe');
    assert.ok(europeGroup.timezones.some(tz => tz.iana === 'Europe/London'));
  });

  test('normalizeIanaTimezone extracts canonical IANA identifier from legacy strings', () => {
    // Legacy format from old select dropdown
    assert.equal(
      normalizeIanaTimezone('America/Chicago (CST - UTC-6)'),
      'America/Chicago'
    );
    assert.equal(
      normalizeIanaTimezone('America/New_York (EST - UTC-5)'),
      'America/New_York'
    );
    assert.equal(
      normalizeIanaTimezone('Asia/Kolkata (IST - UTC+5:30)'),
      'Asia/Kolkata'
    );

    // Clean IANA formats
    assert.equal(normalizeIanaTimezone('Asia/Kolkata'), 'Asia/Kolkata');
    assert.equal(normalizeIanaTimezone('America/New_York'), 'America/New_York');
    assert.equal(normalizeIanaTimezone('Europe/London'), 'Europe/London');

    // Invalid or empty formats fallback to default
    assert.equal(normalizeIanaTimezone(''), 'America/Chicago');
    assert.equal(normalizeIanaTimezone(undefined), 'America/Chicago');
  });

  test('getTimezoneInfo formats human-readable labels with live UTC offsets', () => {
    const opt = getTimezoneInfo('Asia/Kolkata');
    assert.ok(opt);
    assert.equal(opt.iana, 'Asia/Kolkata');
    assert.equal(opt.offset, 'UTC+05:30');
    assert.ok(opt.city.length > 0);

    const nyOpt = getTimezoneInfo('America/New_York');
    assert.ok(nyOpt);
    assert.equal(nyOpt.iana, 'America/New_York');
    assert.ok(nyOpt.offset.startsWith('UTC-04:') || nyOpt.offset.startsWith('UTC-05:'));
  });

  test('getBrowserTimezone retrieves current system timezone accurately', () => {
    const userTz = getBrowserTimezone();
    assert.ok(typeof userTz === 'string' && userTz.length > 0);
    // Must be a valid IANA zone recognized by Intl
    assert.doesNotThrow(() => {
      new Intl.DateTimeFormat('en-US', { timeZone: userTz });
    });
  });
});
