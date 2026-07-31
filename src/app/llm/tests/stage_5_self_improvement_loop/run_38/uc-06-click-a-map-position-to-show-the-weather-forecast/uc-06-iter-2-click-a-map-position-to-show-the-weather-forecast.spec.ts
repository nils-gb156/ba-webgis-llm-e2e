// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default in the initial state)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger a forecast load
  // Use a position well within the visible map area (e.g. over Germany)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Wait for the highlighted coordinate to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to appear and contain 24 entries
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // The forecast entries are typically rendered as a list of items within the section.
  // We count the number of forecast items and assert there are 24.
  // Using expect.poll to wait for the async data to load and render.
  await expect.poll(() => weatherForecastSection.locator('li').count()).toBe(24);
});
