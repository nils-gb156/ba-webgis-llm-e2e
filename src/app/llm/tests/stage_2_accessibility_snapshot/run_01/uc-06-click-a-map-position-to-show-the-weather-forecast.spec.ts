// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

const extractForecastEntryCount = (value: unknown): number | undefined => {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  for (const key of ['forecast', 'forecasts', 'entries', 'list', 'items']) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate.length;
    }
  }

  const hourly = record.hourly;
  if (hourly && typeof hourly === 'object') {
    const hourlyRecord = hourly as Record<string, unknown>;

    if (Array.isArray(hourlyRecord.time)) {
      return hourlyRecord.time.length;
    }

    for (const candidate of Object.values(hourlyRecord)) {
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }
  }

  for (const [key, candidate] of Object.entries(record)) {
    if (key.toLowerCase().includes('time') && Array.isArray(candidate)) {
      return candidate.length;
    }
  }

  for (const candidate of Object.values(record)) {
    const nestedCount = extractForecastEntryCount(candidate);
    if (nestedCount !== undefined) {
      return nestedCount;
    }
  }

  return undefined;
};

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    if (/forecast/i.test(request.url()) && ['fetch', 'xhr'].includes(request.resourceType())) {
      forecastRequestUrls.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse((response) => {
    return (
      /forecast/i.test(response.url()) &&
      ['fetch', 'xhr'].includes(response.request().resourceType()) &&
      response.request().method() === 'GET' &&
      response.ok()
    );
  });

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.5),
      y: Math.round(mapBox.height * 0.5)
    }
  });

  const forecastResponse = await forecastResponsePromise;

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  const forecastPayload = await forecastResponse.json();
  const forecastEntryCount = extractForecastEntryCount(forecastPayload);

  expect(forecastEntryCount).toBe(24);
});
