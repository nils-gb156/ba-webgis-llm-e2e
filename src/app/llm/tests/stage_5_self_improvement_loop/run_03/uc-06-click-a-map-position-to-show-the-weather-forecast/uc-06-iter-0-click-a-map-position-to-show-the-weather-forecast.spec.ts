// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it should be by default per screenshot/accessibility tree)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast request
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Wait for the forecast to load by checking the info panel content
  await expect.poll(() => page.getByTestId('weather-forecast-section').isVisible()).toBeTruthy();

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify the forecast contains 24 entries
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection.getByRole('row')).toHaveCount(24);
});
