// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const findForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      return value.length;
    }

    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;

    for (const key of ['forecast', 'hourly', 'entries', 'list', 'timeseries', 'data']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    for (const nestedValue of Object.values(record)) {
      const nestedCount = findForecastEntryCount(nestedValue);
      if (nestedCount !== undefined) {
        return nestedCount;
      }
    }

    return undefined;
  };

  const countRenderedForecastEntries = async (): Promise<number> => {
    const infoPanel = page.getByRole('complementary').first();
    const infoPanelVisible = await infoPanel.isVisible().catch(() => false);

    if (infoPanelVisible) {
      const listItemCount = await infoPanel.getByRole('listitem').count();
      if (listItemCount === 24) {
        return listItemCount;
      }

      const rowCount = await infoPanel.getByRole('row').count();
      if (rowCount === 24 || rowCount === 25) {
        return 24;
      }

      const panelText = (await infoPanel.textContent()) ?? '';
      return (panelText.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
    }

    const pageText = await page.evaluate(() => document.body.innerText);
    return (pageText.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
  };

  const infoPanel = page.getByRole('complementary').first();
  const infoPanelVisible = await infoPanel.isVisible().catch(() => false);
  if (infoPanelVisible) {
    await expect(infoPanel).toBeVisible();
  }

  const olViewport = page.locator('.ol-viewport').first();
  const mapTarget = (await olViewport.count()) > 0 ? olViewport : page.locator('canvas').first();

  await expect(mapTarget).toBeVisible();

  const mapBox = await mapTarget.boundingBox();
  expect(mapBox).not.toBeNull();

  const clickPosition = mapBox
    ? { x: mapBox.width * 0.35, y: mapBox.height * 0.35 }
    : { x: 200, y: 200 };

  const beforeMapImage = await mapTarget.screenshot();

  const observedRequestUrls = new Set<string>();
  page.on('request', request => {
    observedRequestUrls.add(request.url());
  });

  let forecastEntryCountFromResponse: number | undefined;
  const forecastResponsePromise = page.waitForResponse(async response => {
    if (!response.ok()) {
      return false;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!/json/i.test(contentType)) {
      return false;
    }

    try {
      const responseBody = await response.json();
      const count = findForecastEntryCount(responseBody);
      if (count === 24) {
        forecastEntryCountFromResponse = count;
        return true;
      }
    } catch {
      return false;
    }

    return false;
  });

  await mapTarget.click({ position: clickPosition });

  const forecastResponse = await forecastResponsePromise;

  await expect.poll(() => observedRequestUrls.has(forecastResponse.url())).toBe(true);
  expect(forecastEntryCountFromResponse).toBe(24);

  await expect.poll(async () => {
    const currentMapImage = await mapTarget.screenshot();
    return currentMapImage.equals(beforeMapImage);
  }).toBe(false);

  const weatherForecastHeading = page.getByRole('heading', { name: /weather forecast/i });
  if (infoPanelVisible) {
    await expect(infoPanel.getByRole('heading', { name: /weather forecast/i })).toBeVisible();
  } else {
    await expect(weatherForecastHeading).toBeVisible();
  }

  await expect.poll(async () => countRenderedForecastEntries()).toBe(24);
});
