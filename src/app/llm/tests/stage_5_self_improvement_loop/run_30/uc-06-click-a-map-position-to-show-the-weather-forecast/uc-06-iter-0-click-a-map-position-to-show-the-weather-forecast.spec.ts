// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default, but let's ensure it's open)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast
  await page.getByTestId('map-container').click({ position: { x: 600, y: 400 } });

  // Wait for the info panel to update with the forecast
  await expect.poll(() => page.getByTestId('weather-forecast-section').isVisible()).toBeTruthy();

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify the forecast contains 24 entries
  const forecastList = page.getByTestId('weather-forecast-section').locator('ul');
  await expect(forecastList.locator('li')).toHaveCount(24);
});
