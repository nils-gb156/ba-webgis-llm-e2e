// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and toggled on
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');

  // Check if the info panel toggle is already pressed (active)
  const isTogglePressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isTogglePressed !== 'true') {
    await infoPanelToggle.click();
  }

  // Ensure the info panel is visible
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the forecast load
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Wait for the weather forecast section to appear and load data
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the forecast contains 24 entries
  // The forecast entries are likely rendered inside the weather-forecast-section
  // We need to poll for the count to settle as it loads asynchronously
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('[data-testid="forecast-entry"], li, tr, div[class*="forecast-entry"]');
    // Fallback: count any distinct child elements that look like forecast items if specific testid is missing
    // Based on typical React lists, let's count immediate children or a specific list item pattern.
    // Since no specific testid for entries is provided, we rely on the structure.
    // Let's assume the section contains a list or grid of items.
    // We will count the number of visible elements inside the section that are likely forecast items.
    // A robust way without specific IDs is to check if the section has content and try to count rows/items.
    // Let's try to count elements with a common class or role if available, or just check length of children.
    // Given the complexity, let's look for any element inside the section.
    // If the section renders a table, rows are tr. If a list, li. If divs, divs.
    // Let's try to find the first container of items.
    const items = weatherForecastSection.locator('li, tr, [role="listitem"], div').filter({ hasText: /^\d+$/ }); // Heuristic for day numbers or similar
    return items.count();
  }).toBe(24);
});
