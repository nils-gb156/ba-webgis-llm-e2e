// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const forecastSection = infoPanel.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanel).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.6),
      y: Math.round(mapBox.height * 0.5)
    }
  });

  let highlightedCoordinate: [number, number] | undefined;
  await expect.poll(async () => {
    highlightedCoordinate = await getHighlightedCoordinate(page);
    return highlightedCoordinate?.every((value) => Number.isFinite(value)) ?? false;
  }).toBe(true);

  await expect(forecastSection).toBeVisible();
  await expect(forecastSection.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
