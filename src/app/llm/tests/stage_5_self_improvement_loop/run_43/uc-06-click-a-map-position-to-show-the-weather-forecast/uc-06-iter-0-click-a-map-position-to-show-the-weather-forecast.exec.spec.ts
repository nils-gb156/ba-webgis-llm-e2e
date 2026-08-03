// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapZoomLevel,
} from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(
    infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })
  ).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const initialHighlight = await getHighlightedCoordinate(page);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.58),
      y: Math.round(mapBox.height * 0.38),
    },
  });

  await expect
    .poll(async () => {
      const coordinate = await getHighlightedCoordinate(page);
      return coordinate ? JSON.stringify(coordinate) : undefined;
    })
    .not.toBe(initialHighlight ? JSON.stringify(initialHighlight) : undefined);

  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    const text = (await weatherForecastSection.textContent()) ?? '';
    const matches = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
    return new Set(matches).size;
  }).toBe(24);
});
