// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and the map canvas to be present
  // Assuming the map canvas has a specific test id or role. 
  // If no specific test id is known for the canvas, we wait for a generic map container.
  // Based on typical Open Pioneer setups, we might look for a canvas or a div with map classes.
  // However, the prompt implies we should click the map canvas.
  // Let's assume there is a map container with a test id or we can find the canvas.
  // Since no specific test ids are provided in the prompt for the map, we'll try to find the canvas.
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map canvas to click a position within it
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found or not visible');
  }

  // Click near the center of the map canvas
  const clickX = box.x + box.width / 2;
  const clickY = box.y + box.height / 2;

  // Click on the map
  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to load the forecast.
  // We need to identify the info panel. Let's assume it has a test id or is a specific region.
  // Common pattern: info panel might be a sidebar or a modal.
  // Let's assume there is a test id for the info panel, e.g., 'info-panel'.
  // If not, we might look for a specific role or text.
  // Since the prompt mentions "info panel", let's try to find it by role or test id.
  // Let's assume the info panel is visible by default or becomes visible after interaction.
  
  // Wait for the info panel to be visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Wait for the weather forecast section to appear
  // Assuming the forecast section has a test id or specific text
  const forecastSection = infoPanel.locator('[data-testid="weather-forecast"]');
  await expect(forecastSection).toBeVisible();

  // Assert that the clicked position is highlighted on the map.
  // This is tricky because map features are not DOM elements.
  // The prompt says map state is not in DOM. So we might not be able to assert this directly via DOM.
  // However, the prompt says "Expected results: The clicked position is highlighted on the map."
  // If we cannot assert this via DOM, we might skip it or assume it's working if the forecast appears.
  // But let's check if there's a marker or something in the DOM.
  // Sometimes, a marker is added as a DOM element for the clicked point.
  const marker = page.locator('[data-testid="map-marker"]');
  await expect(marker).toBeVisible();

  // Assert that the forecast contains 24 entries.
  // Assuming each entry is a list item or a row in a table.
  // Let's assume the forecast entries have a test id or are list items.
  const forecastEntries = forecastSection.locator('[data-testid="forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);
});
