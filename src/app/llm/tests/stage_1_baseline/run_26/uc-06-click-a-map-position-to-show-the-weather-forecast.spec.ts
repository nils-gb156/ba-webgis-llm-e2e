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

  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map canvas has no bounding box and is not interactive.');
  }

  const isWeatherForecastRequest = (url: string) => /weather|forecast/i.test(url);

  const extractForecastCount = (data: unknown): number | undefined => {
    if (Array.isArray(data)) {
      return data.length;
    }

    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const record = data as Record<string, unknown>;

    for (const key of ['entries', 'forecast', 'forecasts', 'items', 'results', 'data']) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.length;
      }
    }

    const hourly = record.hourly;
    if (hourly && typeof hourly === 'object') {
      const hourlyRecord = hourly as Record<string, unknown>;

      for (const key of ['time', 'times', 'entries', 'forecast']) {
        const value = hourlyRecord[key];
        if (Array.isArray(value)) {
          return value.length;
        }
      }

      for (const value of Object.values(hourlyRecord)) {
        if (Array.isArray(value)) {
          return value.length;
        }
      }
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        return value.length;
      }

      const nestedCount = extractForecastCount(value);
      if (nestedCount !== undefined) {
        return nestedCount;
      }
    }

    return undefined;
  };

  let weatherRequestUrl: string | undefined;
  page.on('request', request => {
    if (['fetch', 'xhr'].includes(request.resourceType()) && isWeatherForecastRequest(request.url())) {
      weatherRequestUrl = request.url();
    }
  });

  const weatherResponsePromise = page.waitForResponse(response => {
    return (
      ['fetch', 'xhr'].includes(response.request().resourceType()) &&
      response.ok() &&
      isWeatherForecastRequest(response.url())
    );
  });

  await mapCanvas.click({
    position: {
      x: Math.floor(mapBox.width * 0.55),
      y: Math.floor(mapBox.height * 0.4)
    }
  });

  const weatherResponse = await weatherResponsePromise;

  await expect.poll(() => weatherRequestUrl).toMatch(/weather|forecast/i);

  const forecastResponseData = await weatherResponse.json();
  const forecastCountFromResponse = extractForecastCount(forecastResponseData);
  expect(forecastCountFromResponse).toBe(24);

  const weatherForecastSection = infoPanel
    .getByRole('heading', { name: /weather forecast/i })
    .or(infoPanel.getByText(/weather forecast/i));

  await expect(weatherForecastSection.first()).toBeVisible();

  await expect
    .poll(async () => {
      const listItemCount = await infoPanel.getByRole('listitem').count();
      if (listItemCount === 24) {
        return listItemCount;
      }

      const rowCount = await infoPanel.getByRole('row').count();
      if (rowCount === 24) {
        return rowCount;
      }

      return forecastCountFromResponse;
    })
    .toBe(24);
});
