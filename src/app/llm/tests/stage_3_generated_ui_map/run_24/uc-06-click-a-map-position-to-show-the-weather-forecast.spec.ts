// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
  const weatherForecastEntries = infoPanel.getByTestId('weather-forecast-entry');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanel).toBeVisible();

  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width / 2),
      y: Math.round(box.height / 2),
    },
  });

  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastEntries).toHaveCount(24);
});
