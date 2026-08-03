// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  let forecastRequestUrl: string | undefined;
  page.on('request', (request) => {
    if (
      ['fetch', 'xhr'].includes(request.resourceType()) &&
      /forecast|weather|open-meteo|latitude|longitude|lat=|lon=/i.test(request.url())
    ) {
      forecastRequestUrl = request.url();
    }
  });

  const forecastResponsePromise = page.waitForResponse((response) => {
    return (
      ['fetch', 'xhr'].includes(response.request().resourceType()) &&
      response.ok() &&
      /forecast|weather|open-meteo|latitude|longitude|lat=|lon=/i.test(response.url())
    );
  });

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box; the map is not interactable.');
  }

  const clickPosition = {
    x: Math.min(Math.floor(mapBox.width - 20), Math.max(20, Math.floor(mapBox.width * 0.75))),
    y: Math.min(Math.floor(mapBox.height - 20), Math.max(20, Math.floor(mapBox.height * 0.5)))
  };

  await mapContainer.click({ position: clickPosition });

  await expect.poll(() => forecastRequestUrl).toMatch(/forecast|weather|open-meteo|latitude|longitude|lat=|lon=/i);

  const forecastResponse = await forecastResponsePromise;
  const responseText = await forecastResponse.text();

  let responseBody: unknown = responseText;
  try {
    responseBody = JSON.parse(responseText);
  } catch {
    // Keep plain text response if it is not JSON.
  }

  const findForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === 24) {
        return 24;
      }
      for (const item of value) {
        const nestedCount = findForecastEntryCount(item);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }
      return undefined;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const arrayValues = Object.values(record).filter(Array.isArray) as unknown[][];

      if (arrayValues.length > 0) {
        const distinctLengths = [...new Set(arrayValues.map((entry) => entry.length))];
        if (distinctLengths.length === 1 && distinctLengths[0] === 24) {
          return 24;
        }
      }

      for (const preferredKey of ['entries', 'forecast', 'forecasts', 'hourly', 'hours', 'data']) {
        if (preferredKey in record) {
          const nestedCount = findForecastEntryCount(record[preferredKey]);
          if (nestedCount !== undefined) {
            return nestedCount;
          }
        }
      }

      for (const nestedValue of Object.values(record)) {
        const nestedCount = findForecastEntryCount(nestedValue);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }
    }

    return undefined;
  };

  expect(findForecastEntryCount(responseBody)).toBe(24);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
});
