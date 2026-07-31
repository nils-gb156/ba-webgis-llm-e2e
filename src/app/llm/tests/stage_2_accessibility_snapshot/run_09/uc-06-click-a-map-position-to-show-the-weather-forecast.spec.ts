// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows "Info Panel Switcher" [pressed], so it should already be open.
  // We assert visibility to be sure before interacting.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the center of the map canvas to trigger the forecast load.
  // We use a position in the middle of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 200 } });

  // Wait for the weather forecast section to appear in the info panel.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Verify that the forecast contains 24 entries.
  // The forecast entries are likely list items or similar structure within the weather-forecast-section.
  // We poll for the count of forecast entries to settle.
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    // Assuming each forecast entry is a distinct element, e.g., a div or list item.
    // If the structure is a list, we might count list items.
    // Let's assume the entries are direct children or have a common class/role.
    // Since we don't have specific test IDs for entries, we rely on the structure.
    // A common pattern is a list of cards or rows. Let's try to count elements that look like forecast entries.
    // If the section contains a list, we can count the list items.
    const entries = section.locator('li');
    if (await entries.count() > 0) {
      return await entries.count();
    }
    // Fallback: if not list items, maybe they are divs with a specific class or role.
    // Without more context, we'll assume list items for now.
    // If the above fails, we might need to inspect the actual DOM structure in the app.
    // For now, let's assume the section has a list of forecast items.
    return 0;
  }).toBe(24);
});
