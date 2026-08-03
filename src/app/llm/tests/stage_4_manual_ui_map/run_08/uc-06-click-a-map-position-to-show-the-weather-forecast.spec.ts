// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
  const weatherForecast = infoPanel.getByTestId('weather-forecast');
  const forecastEntries = infoPanel.getByTestId('weather-forecast-entry');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.max(1, Math.floor(mapBox.width * 0.7)),
      y: Math.max(1, Math.floor(mapBox.height * 0.6)),
    },
  });

  await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);
  await expect(weatherForecast).toBeVisible();
  await expect(forecastEntries).toHaveCount(24);
});
