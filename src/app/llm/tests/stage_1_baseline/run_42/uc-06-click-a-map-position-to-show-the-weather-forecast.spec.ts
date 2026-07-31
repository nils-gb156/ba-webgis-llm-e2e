// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and the map canvas to be ready
  // We assume the map canvas has a specific test id or role. 
  // If not provided, we might need to rely on a general container or just wait for network idle.
  // Let's assume there is a map container or we can click on the canvas directly if it's the main interactive element.
  // Since no specific test id for the map is given in the prompt, we'll try to find the canvas or a map container.
  // However, the prompt mentions "map canvas is interactive". Let's look for a canvas element.
  
  // Wait for the info panel to be visible as per preconditions
  // We need to identify the info panel. Let's assume it has a test id or role.
  // Common pattern: info panel might be a dialog or a side panel.
  // Let's try to find an element that looks like an info panel.
  // If no specific locator is known, we might need to infer from the expected result "info panel displays...".
  // Let's assume the info panel is visible by default or becomes visible after some action.
  // The prompt says "The info panel is visible" as a precondition.
  
  // Let's wait for the map to be ready. Often maps have a specific class or test id.
  // Without specific test ids, we might have to use a generic locator.
  // Let's try to click on the center of the page, assuming the map takes up most of the viewport.
  // Or better, wait for the canvas to be visible.
  
  await page.waitForSelector('canvas', { state: 'visible' });

  // Get the bounding box of the canvas to click on it
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  
  if (!box) {
    throw new Error('Map canvas not found or not visible');
  }

  // Click on the map canvas
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

  // Wait for the info panel to load the forecast
  // We need to identify the info panel. Let's assume it has a test id "info-panel" or similar.
  // If not, we might look for a section that contains weather forecast.
  // Let's assume there is a test id for the info panel.
  const infoPanel = page.getByTestId('info-panel');
  
  // Wait for the info panel to be visible
  await expect(infoPanel).toBeVisible();

  // Wait for the weather forecast section to appear
  // Let's assume there is a test id for the weather forecast section or a specific text
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the clicked position is highlighted on the map
  // This is hard to assert via DOM since it's on canvas. 
  // However, the prompt says "The clicked position is highlighted on the map".
  // Without map helper functions, we cannot assert this directly.
  // We will skip this assertion as it's not possible via DOM locators.

  // Verify that the info panel displays a weather forecast section
  // Already asserted above.

  // Verify that the forecast contains 24 entries
  // Let's assume each entry has a test id or is a list item.
  // Let's assume there is a list of forecast items.
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
