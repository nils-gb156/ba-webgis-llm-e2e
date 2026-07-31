// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The info panel toggle button is in the "pressed" state (active), so the panel should already be open.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click a position on the map canvas to trigger the weather forecast.
  // We click near the center of the visible map area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Wait for the highlight to appear on the map, indicating the click was registered.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to appear.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // The forecast entries are rendered with data-testid="weather-forecast-entry".
  // Count them to verify there are 24 entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
