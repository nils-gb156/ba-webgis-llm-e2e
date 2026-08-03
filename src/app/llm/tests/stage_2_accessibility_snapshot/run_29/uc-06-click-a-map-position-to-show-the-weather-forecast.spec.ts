// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
  };

  const extractPreferredForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      return value.length;
    }

    const record = asRecord(value);
    if (!record) {
      return undefined;
    }

    const hourly = asRecord(record.hourly);
    const properties = asRecord(record.properties);

    const candidateArrays: unknown[] = [
      record.entries,
      record.forecast,
      record.forecasts,
      record.weather,
      record.items,
      hourly?.time,
      hourly?.temperature_2m,
      properties?.timeseries
    ];

    for (const candidate of candidateArrays) {
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    return undefined;
  };

  const collectArrayLengths = (value: unknown, lengths: number[] = []): number[] => {
    if (Array.isArray(value)) {
      lengths.push(value.length);
      for (const item of value) {
        collectArrayLengths(item, lengths);
      }
      return lengths;
    }

    const record = asRecord(value);
    if (!record) {
      return lengths;
    }

    for (const nestedValue of Object.values(record)) {
      collectArrayLengths(nestedValue, lengths);
    }

    return lengths;
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const forecastResponsePromise = page.waitForResponse((response) => {
    const url = response.url().toLowerCase();
    const contentType = response.headers()['content-type'] ?? '';

    return (
      response.ok() &&
      contentType.includes('application/json') &&
      (url.includes('forecast') ||
        url.includes('weather') ||
        url.includes('open-meteo') ||
        url.includes('brightsky'))
    );
  });

  await mapContainer.click({
    position: {
      x: Math.round(mapBox!.width * 0.7),
      y: Math.round(mapBox!.height * 0.5)
    }
  });

  const forecastResponse = await forecastResponsePromise;
  const forecastResponseUrl = forecastResponse.url();
  const forecastData: unknown = await forecastResponse.json();

  expect(forecastResponseUrl).toMatch(
    /(?:(?:lat|latitude)=[^&]+.*(?:lon|lng|longitude)=[^&]+)|(?:(?:lon|lng|longitude)=[^&]+.*(?:lat|latitude)=[^&]+)/i
  );

  const preferredForecastEntryCount = extractPreferredForecastEntryCount(forecastData);
  const allArrayLengths = collectArrayLengths(forecastData);
  const forecastEntryCount =
    preferredForecastEntryCount === 24
      ? preferredForecastEntryCount
      : allArrayLengths.find((length) => length === 24);

  expect(forecastEntryCount).toBe(24);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
  await expect(weatherForecastSection).toContainText(/\d/);
});
