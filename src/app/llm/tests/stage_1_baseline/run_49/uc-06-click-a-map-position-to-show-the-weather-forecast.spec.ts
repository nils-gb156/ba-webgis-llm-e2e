// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoPanel = page.locator('aside, [role="complementary"]').first();
  await expect(infoPanel).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const weatherRequestUrls: string[] = [];
  page.on('request', request => {
    if (/weather|forecast|meteo/i.test(request.url())) {
      weatherRequestUrls.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => {
    const resourceType = response.request().resourceType();
    return (
      response.ok() &&
      (resourceType === 'fetch' || resourceType === 'xhr') &&
      /weather|forecast|meteo/i.test(response.url())
    );
  });

  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas has no bounding box.');
  }

  await mapCanvas.click({
    position: {
      x: Math.floor(mapBox.width * 0.6),
      y: Math.floor(mapBox.height * 0.4),
    },
  });

  await expect.poll(() => weatherRequestUrls.length).toBeGreaterThan(0);

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = await forecastResponse.json();

  const collectArrayLengths = (value: unknown, seen = new Set<unknown>()): number[] => {
    if (!value || typeof value !== 'object' || seen.has(value)) {
      return [];
    }

    seen.add(value);
    const record = value as Record<string, unknown>;
    const lengths: number[] = [];

    const addIfArray = (candidate: unknown) => {
      if (Array.isArray(candidate)) {
        lengths.push(candidate.length);
      }
    };

    addIfArray(record.entries);
    addIfArray(record.forecast);
    addIfArray(record.items);
    addIfArray(record.results);
    addIfArray(record.list);
    addIfArray(record.data);

    if (record.hourly && typeof record.hourly === 'object') {
      const hourly = record.hourly as Record<string, unknown>;
      addIfArray(hourly.time);
      addIfArray(hourly.temperature_2m);
    }

    if (record.forecast && typeof record.forecast === 'object') {
      const nestedForecast = record.forecast as Record<string, unknown>;
      addIfArray(nestedForecast.forecastday);

      const forecastDay = nestedForecast.forecastday;
      if (Array.isArray(forecastDay) && forecastDay.length > 0) {
        const firstDay = forecastDay[0];
        if (firstDay && typeof firstDay === 'object') {
          addIfArray((firstDay as Record<string, unknown>).hour);
        }
      }
    }

    for (const nestedValue of Object.values(record)) {
      lengths.push(...collectArrayLengths(nestedValue, seen));
    }

    return lengths;
  };

  expect(collectArrayLengths(forecastPayload)).toContain(24);

  const weatherForecastHeading = infoPanel.getByRole('heading', { name: /weather forecast/i }).first();
  await expect(weatherForecastHeading).toBeVisible();
});
