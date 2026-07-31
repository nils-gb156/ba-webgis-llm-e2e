// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify the info panel is visible and the map canvas is interactive
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Click on the map canvas to trigger the forecast
  // Use a position that is clearly on the map canvas, not on any overlay or control.
  await page.getByTestId('map-container').click({
    position: { x: 500, y: 300 },
  });

  // Wait for the info panel to load the forecast
  // The forecast section becomes visible once data is loaded.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Assert the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Assert the forecast contains 24 entries
  // The forecast entries are rendered as a list of divs with data-testid="weather-forecast-entry"
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
