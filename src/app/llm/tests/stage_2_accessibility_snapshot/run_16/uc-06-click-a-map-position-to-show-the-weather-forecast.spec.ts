// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const initialForecastHint = weatherForecastSection.getByText('Click on the map to load a forecast.');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(initialForecastHint).toBeVisible();

  const forecastResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok()) {
      return false;
    }

    const contentType = (response.headers()['content-type'] ?? '').toLowerCase();
    if (!contentType.includes('json')) {
      return false;
    }

    try {
      const json = (await response.json()) as any;
      return Array.isArray(json?.hourly?.time) && json.hourly.time.length >= 24;
    } catch {
      return false;
    }
  });

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round(mapBox!.width * 0.5),
      y: Math.round(mapBox!.height * 0.5),
    },
  });

  const forecastResponse = await forecastResponsePromise;
  const forecastJson = (await forecastResponse.json()) as any;

  expect(Array.isArray(forecastJson?.hourly?.time)).toBe(true);
  expect(forecastJson.hourly.time.length).toBeGreaterThanOrEqual(24);

  await expect(weatherForecastSection).toBeVisible();
  await expect(initialForecastHint).toBeHidden();

  await expect
    .poll(
      async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
          return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount === 25) {
          return 24;
        }
        if (rowCount > 0) {
          return rowCount;
        }

        const sectionText = (await weatherForecastSection.textContent()) ?? '';
        const hourlyLabels = sectionText.match(/\b(?:[01]\d|2[0-3]):00\b/g) ?? [];
        return new Set(hourlyLabels).size;
      },
      { timeout: 15000 }
    )
    .toBe(24);
});
