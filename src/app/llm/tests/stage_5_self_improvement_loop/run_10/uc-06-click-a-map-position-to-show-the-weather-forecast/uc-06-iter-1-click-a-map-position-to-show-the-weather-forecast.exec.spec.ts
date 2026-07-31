// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is already visible in the initial state)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas at a specific position (center of the visible map area)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 600, y: 300 } });

  // Wait for the highlight to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to appear in the info panel
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the forecast contains 24 entries
  // Each forecast entry has a unique test-id, so we can count them directly.
  const forecastEntries = weatherForecastSection.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
