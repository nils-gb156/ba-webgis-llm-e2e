// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The UI map states info-panel is visibleByDefault: true, but we ensure it's not toggled off.
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');
  
  // Check current state of the toggle to decide if we need to click it.
  // If it's already pressed (active), the panel is visible. If not, we click to open.
  const isTogglePressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isTogglePressed !== 'true') {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the forecast.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the forecast to load and appear in the info panel.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify the forecast container is visible.
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Verify the forecast contains 24 entries.
  // The entries are dynamic, so we poll for the count.
  await expect.poll(async () => {
    const entries = page.getByTestId('weather-forecast-entry');
    return await entries.count();
  }).toBe(24);

  // Verify the clicked position is highlighted on the map.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
