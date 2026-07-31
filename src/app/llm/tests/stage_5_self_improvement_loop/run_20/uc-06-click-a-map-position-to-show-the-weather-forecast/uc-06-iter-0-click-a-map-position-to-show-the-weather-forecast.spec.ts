// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Click on the center of the map to trigger the forecast
  await page.getByTestId('map-container').click({ position: { x: 250, y: 250 } });

  // Wait for the info panel to load the forecast
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible({ timeout: 30000 });

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify the info panel displays a weather forecast section with 24 entries
  const forecastEntries = page.getByTestId('weather-forecast-section').locator('.forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
