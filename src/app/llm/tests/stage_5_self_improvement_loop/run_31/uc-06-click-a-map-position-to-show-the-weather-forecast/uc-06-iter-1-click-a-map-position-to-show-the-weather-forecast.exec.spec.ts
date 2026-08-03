// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const mapContainer = page.getByTestId('map-container');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const weatherForecast = page.getByTestId('weather-forecast');
  const forecastEntries = page.getByTestId('weather-forecast-entry');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    return Array.isArray(center) && center.length === 2;
  }).toBe(true);

  const previousHighlight = await getHighlightedCoordinate(page);
  const previousHighlightKey = previousHighlight?.join(',');

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round(mapBox!.width * 0.6),
      y: Math.round(mapBox!.height * 0.45)
    }
  });

  await expect.poll(async () => {
    const highlight = await getHighlightedCoordinate(page);
    return Array.isArray(highlight) && highlight.length === 2;
  }).toBe(true);

  if (previousHighlightKey) {
    await expect.poll(async () => {
      const highlight = await getHighlightedCoordinate(page);
      return highlight?.join(',');
    }).not.toBe(previousHighlightKey);
  }

  await expect(weatherForecast).toBeVisible();
  await expect(forecastEntries).toHaveCount(24);
});
