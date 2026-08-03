// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapZoomLevel
} from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
  const weatherForecastEntries = weatherForecastSection.getByTestId('weather-forecast-entry');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

  if (!(await infoPanel.isVisible())) {
    const pressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  const initialHighlight = await getHighlightedCoordinate(page);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(mapBox.width * 0.5),
      y: Math.floor(mapBox.height * 0.6)
    }
  });

  if (initialHighlight) {
    await expect.poll(async () => {
      const currentHighlight = await getHighlightedCoordinate(page);
      if (!currentHighlight) {
        return false;
      }
      return (
        currentHighlight[0] !== initialHighlight[0] ||
        currentHighlight[1] !== initialHighlight[1]
      );
    }).toBe(true);
  } else {
    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);
  }

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastEntries).toHaveCount(24);
});
