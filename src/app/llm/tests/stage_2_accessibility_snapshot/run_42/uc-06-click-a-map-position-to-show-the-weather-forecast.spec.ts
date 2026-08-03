// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function extractForecastEntryCount(payload: unknown): number | undefined {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const data = payload as Record<string, unknown>;

  for (const key of ['forecast', 'entries', 'data', 'timeseries']) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.length;
    }
  }

  const properties = data.properties;
  if (properties && typeof properties === 'object') {
    const propertiesRecord = properties as Record<string, unknown>;
    const timeseries = propertiesRecord.timeseries;
    if (Array.isArray(timeseries)) {
      return timeseries.length;
    }
  }

  const hourly = data.hourly;
  if (hourly && typeof hourly === 'object') {
    const hourlyRecord = hourly as Record<string, unknown>;
    const time = hourlyRecord.time;
    if (Array.isArray(time)) {
      return time.length;
    }

    const arrayLengths = Object.values(hourlyRecord)
      .filter(Array.isArray)
      .map((value) => value.length);

    if (arrayLengths.length > 0 && arrayLengths.every((length) => length === arrayLengths[0])) {
      return arrayLengths[0];
    }
  }

  return undefined;
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(weatherForecastSection).toBeVisible();
  await expect(forecastPlaceholder).toBeVisible();

  const forecastResponses: Array<{ url: string; entryCount: number }> = [];
  page.on('response', async (response) => {
    const request = response.request();
    if (!['fetch', 'xhr'].includes(request.resourceType())) {
      return;
    }
    if (!response.ok()) {
      return;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      return;
    }

    try {
      const payload = await response.json();
      const entryCount = extractForecastEntryCount(payload);
      if (entryCount !== undefined) {
        forecastResponses.push({ url: response.url(), entryCount });
      }
    } catch {
      // Ignore non-JSON or unexpected payloads.
    }
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

  await expect(forecastPlaceholder).not.toBeVisible();

  await expect.poll(() => forecastResponses.some((response) => response.entryCount === 24)).toBe(true);

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 0) {
      return rowCount;
    }

    const articleCount = await weatherForecastSection.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    return 0;
  }).toBe(24);
});
