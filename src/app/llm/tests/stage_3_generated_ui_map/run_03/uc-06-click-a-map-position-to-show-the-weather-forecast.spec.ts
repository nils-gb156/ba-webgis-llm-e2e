// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and interactive
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Click on the map canvas at a specific position (center-ish)
  await page.getByTestId('map-container').click({
    position: { x: 300, y: 200 },
  });

  // Wait for the info panel to be visible (it is visible by default, but we wait for content to load)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Wait for the weather forecast section to appear in the info panel
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the weather forecast entries to appear
  const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(weatherForecastEntries).toHaveCount(24);

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
