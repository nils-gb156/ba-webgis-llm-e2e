// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC06: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is in the initial state per the screenshot)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map to load a forecast
  await page.getByTestId('map-container').click({ position: { x: 500, y: 400 } });

  // Wait for the forecast to load
  await expect.poll(() => page.getByTestId('weather-forecast-section').isVisible()).toBeTruthy();

  // Assert the forecast contains 24 entries
  const forecastEntries = page.getByTestId('weather-forecast-section').locator('[data-testid="weather-forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);

  // Assert the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Assert the UV-Index Stations layer is rendered (as it was visible in the initial state)
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
});
