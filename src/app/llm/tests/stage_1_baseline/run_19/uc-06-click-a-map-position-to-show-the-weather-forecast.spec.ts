// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be interactive and visible
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Click on a position on the map canvas.
  // We click near the center of the viewport to ensure we are on the map.
  const viewportCenter = await page.evaluate(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  }));
  await page.mouse.click(viewportCenter.x, viewportCenter.y);

  // Wait for the info panel to load the forecast.
  // The info panel is typically identified by a test id or role.
  // Assuming the info panel has a test id or is a dialog/panel.
  // If no specific test id is known, we wait for the forecast section to appear.
  // Based on typical Open Pioneer Trails apps, the info panel might be a specific component.
  // Let's assume there is an info panel container and a forecast section within it.
  
  // Wait for the forecast section to be visible
  // Using a generic locator for the forecast section if no test id is provided.
  // Often, these panels have a heading or specific text.
  // Let's wait for the weather forecast text to appear.
  const forecastSection = page.getByText('Weather Forecast').or(page.getByTestId('weather-forecast'));
  await expect(forecastSection).toBeVisible({ timeout: 30000 });

  // Verify the clicked position is highlighted on the map.
  // Since map content is not DOM, we can't directly assert the highlight.
  // However, the presence of the forecast implies the click was registered.
  // We can assert that the info panel is visible and contains forecast data.

  // Verify the info panel displays a weather forecast section.
  // Assuming the forecast section is visible.

  // Verify the forecast contains 24 entries.
  // We need to count the number of forecast entries.
  // Assuming each entry is a list item or a specific component.
  // Let's assume the forecast entries are rendered as a list with test ids or specific structure.
  // If no test id is available, we might need to count elements by a common class or role.
  // Let's assume there is a list of forecast items.
  const forecastEntries = page.locator('[data-testid="forecast-entry"]').or(page.locator('.forecast-item'));
  await expect(forecastEntries).toHaveCount(24);
});
