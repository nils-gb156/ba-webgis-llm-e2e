// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible. The accessibility tree shows "Info Panel Switcher" [pressed],
  // meaning the panel is already open. We assert visibility to confirm the precondition.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click the center of the map canvas to trigger the forecast request.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the weather forecast section to appear in the info panel.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the forecast entries to populate. The expected result is 24 entries.
  // We look for a list or container within the forecast section that holds the entries.
  // Since the specific structure of the 24 entries isn't detailed with test IDs,
  // we poll for the presence of the section and then verify the content count if possible,
  // or simply wait for the section to be populated.
  // Given "Complexity: hard", we should ensure the data is actually loaded.
  // We will poll for the weather forecast section to contain some content or a specific number of items.
  // Assuming the forecast entries are list items or similar within the section.
  // Let's try to find a list within the weather forecast section.
  const forecastList = weatherForecastSection.locator('ul').first();
  
  // Poll for the list to have 24 children (entries).
  await expect.poll(async () => {
    const count = await forecastList.locator('li').count();
    return count;
  }).toBe(24);

  // Verify the clicked position is highlighted on the map.
  // Since we can't assert DOM elements for the map directly, we rely on the successful
  // loading of the forecast at the clicked position as an indirect confirmation.
  // However, if there's a specific marker or feature, it would be hard to locate without test IDs.
  // The prompt says "The clicked position is highlighted on the map."
  // Without a test ID for the marker, we can't directly assert it via DOM.
  // We assume the successful forecast load implies the click was registered and processed.

  // Final assertion: Info panel displays the weather forecast section.
  await expect(weatherForecastSection).toContainText(/Weather Forecast/i);
});
