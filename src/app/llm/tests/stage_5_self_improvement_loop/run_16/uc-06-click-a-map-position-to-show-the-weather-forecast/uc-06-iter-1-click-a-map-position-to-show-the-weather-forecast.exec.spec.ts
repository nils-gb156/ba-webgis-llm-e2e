// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure the map canvas is visible and interactive
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Click on a position on the map canvas
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Wait for the info panel to load the forecast
  await expect.poll(() => page.getByRole('heading', { name: 'Weather Forecast' }).count()).toBeGreaterThan(0);

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify the forecast contains 24 entries
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  const entries = weatherForecastSection.getByTestId('weather-forecast-entry');
  await expect(entries).toHaveCount(24);
});
