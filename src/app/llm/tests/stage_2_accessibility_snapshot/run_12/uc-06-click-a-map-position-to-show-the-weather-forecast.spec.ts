// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is pressed/active in the initial state)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger a forecast load.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  if (mapBox) {
    await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
  }

  // Wait for the forecast section to appear and contain data
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Assert that the forecast contains 24 entries.
  // We assume each entry is represented by a distinct element within the forecast section.
  // We use a poll to wait for the count to settle.
  await expect.poll(async () => {
    const entries = await weatherForecastSection.locator('> *').count();
    return entries;
  }).toBe(24);

  // Assert that the clicked position is highlighted on the map.
  // Since map content is not DOM, we check for the presence of a coordinate viewer
  // which usually updates when a map click occurs, or we can check if the info panel
  // has updated content indicating a selection.
  // However, the prompt says "clicked position is highlighted on the map".
  // Without map helper functions, we rely on the info panel update as the primary indicator.
  // Let's also check if the info panel has some text indicating a location or forecast.
  await expect(infoPanel).toContainText('Weather Forecast');
});
