// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify the info panel is visible and the map canvas is interactive
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Click on the map canvas (use a position likely to trigger the forecast handler)
  await page.getByTestId('map-container').click({
    position: { x: 400, y: 300 },
  });

  // Wait for the info panel to load the forecast
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Assert the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Assert the forecast contains 24 entries
  const forecastList = page.getByTestId('weather-forecast-section').locator('li');
  await expect(forecastList).toHaveCount(24);
});
