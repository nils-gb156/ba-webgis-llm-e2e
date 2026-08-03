// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoPanel = page.locator('[role="complementary"], aside').first();
  const mapCanvas = page.locator('canvas').first();

  await expect(infoPanel).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  const initialInfoPanelText = ((await infoPanel.textContent()) ?? '').trim();

  const forecastKeyPattern = /forecast|hourly|entries|items|list|timeseries|weather|wetter|meteo/i;

  const findForecastEntries = (value: unknown, keyHint = ''): unknown[] | undefined => {
    if (Array.isArray(value)) {
      if (
        value.length === 24 &&
        (forecastKeyPattern.test(keyHint) ||
          value.every(
            (item) =>
              item === null ||
              ['string', 'number', 'boolean'].includes(typeof item) ||
              typeof item === 'object'
          ))
      ) {
        return value;
      }

      for (const item of value) {
        const nested = findForecastEntries(item, keyHint);
        if (nested) {
          return nested;
        }
      }

      return undefined;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      for (const [key, nested] of Object.entries(record)) {
        if (Array.isArray(nested) && nested.length === 24 && forecastKeyPattern.test(key)) {
          return nested;
        }
      }

      for (const [key, nested] of Object.entries(record)) {
        const found = findForecastEntries(nested, key);
        if (found) {
          return found;
        }
      }
    }

    return undefined;
  };

  const forecastResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok()) {
      return false;
    }

    const resourceType = response.request().resourceType();
    if (resourceType !== 'fetch' && resourceType !== 'xhr') {
      return false;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      return false;
    }

    try {
      const payload = await response.json();
      return findForecastEntries(payload) !== undefined;
    } catch {
      return false;
    }
  });

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas is not interactive.');
  }

  await mapCanvas.click({
    position: {
      x: Math.min(box.width - 10, Math.max(10, Math.floor(box.width * 0.35))),
      y: Math.min(box.height - 10, Math.max(10, Math.floor(box.height * 0.4)))
    }
  });

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = await forecastResponse.json();
  const forecastEntries = findForecastEntries(forecastPayload);

  expect(forecastEntries).toHaveLength(24);

  await expect
    .poll(async () => ((await infoPanel.textContent()) ?? '').trim())
    .not.toBe(initialInfoPanelText);

  await expect(infoPanel.getByText(/weather\s*forecast|forecast|wetter\s*vorhersage|vorhersage/i).first()).toBeVisible();
});
