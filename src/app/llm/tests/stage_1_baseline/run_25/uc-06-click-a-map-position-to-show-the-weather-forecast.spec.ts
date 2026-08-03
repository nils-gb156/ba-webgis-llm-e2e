// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const collectArrayLengths = (value: unknown): number[] => {
    if (Array.isArray(value)) {
      return [value.length, ...value.flatMap((item) => collectArrayLengths(item))];
    }
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap((item) => collectArrayLengths(item));
    }
    return [];
  };

  await page.waitForLoadState('networkidle');

  let infoPanel = page.locator('aside').first();
  if ((await infoPanel.count()) === 0) {
    const complementary = page.locator('[role="complementary"]').first();
    infoPanel = (await complementary.count()) > 0 ? complementary : page.locator('body');
  }
  await expect(infoPanel).toBeVisible();

  let map = page.locator('.ol-viewport').first();
  if ((await map.count()) === 0) {
    map = page.locator('canvas').first();
  }
  await expect(map).toBeVisible();

  const mapBox = await map.boundingBox();
  if (!mapBox) {
    throw new Error('Map is not interactive because its bounding box is unavailable.');
  }

  const clickPosition = {
    x: Math.min(Math.floor(mapBox.width - 10), Math.max(10, Math.floor(mapBox.width * 0.75))),
    y: Math.min(Math.floor(mapBox.height - 10), Math.max(10, Math.floor(mapBox.height * 0.4)))
  };

  let forecastRequestUrl: string | undefined;
  page.on('request', (request) => {
    if (/forecast|weather|open-meteo/i.test(request.url())) {
      forecastRequestUrl = request.url();
    }
  });

  const forecastResponsePromise = page.waitForResponse(
    (response) => response.ok() && /forecast|weather|open-meteo/i.test(response.url())
  );

  await map.click({ position: clickPosition });

  const forecastResponse = await forecastResponsePromise;

  await expect.poll(() => forecastRequestUrl).toMatch(/forecast|weather|open-meteo/i);
  await expect.poll(() => forecastRequestUrl).toMatch(
    /(?:[?&](?:lat|latitude|y)=.+[?&](?:lon|lng|longitude|x)=)|(?:[?&](?:lon|lng|longitude|x)=.+[?&](?:lat|latitude|y)=)/i
  );

  const forecastJson = await forecastResponse.json();
  expect(collectArrayLengths(forecastJson)).toContain(24);

  await expect(infoPanel).toContainText(/weather|forecast|wetter|vorhersage/i);

  await expect.poll(async () => {
    const listItems = await infoPanel.getByRole('listitem').count();
    const rows = Math.max(0, (await infoPanel.getByRole('row').count()) - 1);
    const text = await infoPanel.innerText();
    const hourlyTimes = new Set(text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? []).size;
    return [listItems, rows, hourlyTimes].includes(24);
  }).toBe(true);
});
