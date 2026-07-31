// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The screenshot shows the info panel is already open (info-panel-toggle is pressed).
  // We assert this to ensure precondition is met.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the weather forecast.
  // We click near the center of the visible map area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 600, y: 300 } });

  // Wait for the highlighted coordinate to appear on the map.
  // This indicates the map interaction was successful and the click position was registered.
  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

  // Wait for the weather forecast section to appear in the info panel.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the forecast data to load. The use case specifies 24 entries.
  // The forecast entries are rendered with data-testid="weather-forecast-entry".
  // We poll until we have at least 24 entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBeGreaterThanOrEqual(24);
});
