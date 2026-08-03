// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const weatherForecast = page.getByTestId('weather-forecast');
  const forecastEntries = page.getByTestId('weather-forecast-entry');

  await expect(mapContainer).toBeVisible();
  await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(forecastEntries).toHaveCount(0);

  const previousHighlight = await getHighlightedCoordinate(page);

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.55),
      y: Math.round(box.height * 0.45),
    },
  });

  await expect.poll(async () => {
    const currentHighlight = await getHighlightedCoordinate(page);
    if (!currentHighlight) {
      return false;
    }
    if (!previousHighlight) {
      return true;
    }
    return currentHighlight[0] !== previousHighlight[0] || currentHighlight[1] !== previousHighlight[1];
  }).toBe(true);

  await expect(weatherForecast).toBeVisible();
  await expect(forecastEntries).toHaveCount(24);
});
