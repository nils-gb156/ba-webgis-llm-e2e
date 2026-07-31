// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The info panel toggle button is already pressed in the initial state, but we assert it anyway.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas.
  // The map container is identified by its test id. We click near the center of the visible area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 400, y: 300 } });

  // Wait for the forecast to load. The expected result is that the info panel displays a weather forecast section.
  // We poll the info panel to check if it contains the "Weather Forecast" heading or the forecast section.
  await expect.poll(() => page.getByTestId('info-panel').locator('text=Weather Forecast').isVisible()).toBeTruthy();

  // The forecast contains 24 entries. We check the weather-forecast-section for 24 items.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect.poll(() => forecastSection.locator('li').count()).toBe(24);

  // The clicked position is highlighted on the map.
  // We use the helper to check if a highlight exists at a coordinate.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
});
