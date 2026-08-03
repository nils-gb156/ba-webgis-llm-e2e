// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const weatherForecast = page.getByTestId('weather-forecast');
  const forecastEntries = page.getByTestId('weather-forecast-entry');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

  const initialHighlight = await getHighlightedCoordinate(page);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.8),
      y: Math.round(mapBox.height * 0.6),
    },
  });

  await expect.poll(async () => {
    const highlightedCoordinate = await getHighlightedCoordinate(page);
    return (
      highlightedCoordinate !== undefined &&
      JSON.stringify(highlightedCoordinate) !== JSON.stringify(initialHighlight)
    );
  }).toBe(true);

  await expect(weatherForecast).toBeVisible();
  await expect(forecastEntries).toHaveCount(24);
});
