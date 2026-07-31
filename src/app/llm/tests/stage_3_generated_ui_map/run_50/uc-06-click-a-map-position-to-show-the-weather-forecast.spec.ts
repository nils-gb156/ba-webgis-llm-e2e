// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible by default
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast
  await page.getByTestId('map-container').click({ position: { x: 100, y: 100 } });

  // Wait for the info panel to load the forecast
  // The forecast section should become visible
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Verify the clicked position is highlighted on the map
  // We use expect.poll to wait for the highlight to appear
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify the info panel displays a weather forecast section
  // It is already verified to be visible above, but we can check for specific content
  await expect(page.getByTestId('weather-forecast')).toBeVisible();

  // Verify the forecast contains 24 entries
  // We count the weather-forecast-entry elements
  const entryCount = await page.getByTestId('weather-forecast-entry').count();
  expect(entryCount).toBe(24);
});
