// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible and layer switcher/legend are closed to maximize map area
  // The info panel toggle is pressed (open) by default based on context
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legendToggle = page.getByTestId('legend-toggle');

  // Close Layer Switcher if open
  const layerSwitcherIsPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (layerSwitcherIsPressed === 'true') {
    await layerSwitcherToggle.click({ force: true });
  }

  // Close Legend if open
  const legendIsPressed = await legendToggle.getAttribute('aria-pressed');
  if (legendIsPressed === 'true') {
    await legendToggle.click({ force: true });
  }

  // Ensure Info Panel is open
  const infoPanelIsPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelIsPressed !== 'true') {
    await infoPanelToggle.click({ force: true });
  }

  // Click on the map canvas to trigger the forecast
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the weather forecast section to appear in the info panel
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Assert that the forecast contains 24 entries
  // The entries are likely list items or similar structures within the weather forecast section.
  // Based on typical implementations, we look for a list or container with 24 items.
  // We will poll for the count of forecast entries.
  await expect.poll(async () => {
    const entries = await weatherForecastSection.locator('li').count();
    return entries;
  }).toBe(24);
});
