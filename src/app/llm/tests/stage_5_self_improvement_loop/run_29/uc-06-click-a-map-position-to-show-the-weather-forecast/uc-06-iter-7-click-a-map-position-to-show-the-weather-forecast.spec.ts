// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the weather forecast.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 400, y: 300 } });

  // Wait for the info panel to display the weather forecast section.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // The forecast contains 24 entries. We check the weather-forecast-section for 24 list items.
  // The forecast entries are rendered as div elements with the "forecast-entry" class.
  await expect.poll(() => forecastSection.locator('[class*="forecast-entry"]').count()).toBe(24);

  // The clicked position is highlighted on the map.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
});
