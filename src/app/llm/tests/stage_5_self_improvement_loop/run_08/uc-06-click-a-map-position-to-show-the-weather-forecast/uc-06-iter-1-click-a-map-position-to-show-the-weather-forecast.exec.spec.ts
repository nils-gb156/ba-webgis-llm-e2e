// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const weatherForecast = page.getByTestId('weather-forecast');
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  const initialHint = weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true });

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    const pressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(initialHint).toBeVisible();
  await expect(forecastEntries).toHaveCount(0);

  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
  await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

  await mapContainer.click({ position: { x: 780, y: 330 } });

  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecast).toBeVisible();
  await expect(initialHint).toHaveCount(0);
  await expect(forecastEntries).toHaveCount(24);
});
