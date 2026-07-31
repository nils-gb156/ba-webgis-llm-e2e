// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and the toggle is in the pressed state
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');

  // The accessibility tree shows the info panel toggle is already pressed,
  // so the panel should be visible. We assert this to confirm preconditions.
  await expect(infoPanel).toBeVisible();

  // Click the map canvas to trigger the forecast request.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Wait for the info panel to update with the weather forecast section.
  // The forecast section is identified by its test id.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the forecast contains 24 entries.
  // The entries are likely list items or similar structure within the forecast section.
  // We poll for the count to settle as it loads asynchronously.
  await expect.poll(async () => {
    return weatherForecastSection.locator('li').count();
  }).toBe(24);
});
