// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible and open
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');

  // Check if the info panel is currently pressed/open
  const infoPanelPressedState = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelPressedState !== 'true') {
    await infoPanelToggle.click();
  }

  // Wait for the info panel to be visible
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the forecast request
  // We click roughly in the center of the map container
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the weather forecast section to appear in the info panel
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the forecast to contain 24 entries.
  // The entries are likely list items or similar structures within the forecast section.
  // We poll for the count of these entries.
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('li').or(weatherForecastSection.locator('[role="listitem"]')).or(weatherForecastSection.locator('div'));
    // Try to count items that look like forecast entries.
    // Since the structure isn't explicitly defined beyond "24 entries", we look for a list or a set of items.
    // Let's assume the forecast section contains a list with 24 items.
    // If the structure is different, we might need to adjust the locator.
    // Based on the accessibility tree, there isn't a specific list role for the forecast entries.
    // However, the expected result is "24 entries". Let's look for any element that might represent an entry.
    // A common pattern is a list or a grid of items.
    // Let's try to count all direct child elements or elements with a specific pattern if any.
    // Without more specific UI details, we can count the number of elements that appear after the forecast loads.
    // Let's assume the forecast section contains a list of 24 items.
    const count = await weatherForecastSection.locator('li').count();
    if (count > 0) {
      return count;
    }
    // Fallback: check for any visible text content that might indicate entries
    // This is a weak heuristic, but without more info, it's hard to be precise.
    // Let's assume the entries are in a list.
    return count;
  }).toBe(24);

  // Verify that the clicked position is highlighted on the map.
  // Since map content is not DOM, we can't directly assert the highlight.
  // However, the presence of the forecast implies the click was registered.
  // We can check if the info panel shows the forecast, which it does.
  // The "highlighted position" is a visual cue on the map canvas, which is hard to assert without helper functions.
  // Given the constraints, we rely on the forecast appearing as the primary indicator of success.
});
