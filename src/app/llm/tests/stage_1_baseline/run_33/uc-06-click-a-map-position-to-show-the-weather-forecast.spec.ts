// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be present and interactive
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map to click a center position
  const mapBox = await mapCanvas.boundingBox();
  test.skip(!mapBox, 'Map canvas not found');

  const clickX = Math.floor(mapBox.width / 2);
  const clickY = Math.floor(mapBox.height / 2);

  // Click the center of the map
  await page.mouse.click(mapBox.x + clickX, mapBox.y + clickY);

  // Wait for the info panel to load the forecast
  // The info panel usually has a test id or can be identified by role/content
  // Assuming a test id for the info panel or its forecast container based on typical patterns
  // If no specific test id is known, we might look for a specific header or structure.
  // However, the prompt implies we should check for "weather forecast section" and "24 entries".
  
  // Let's assume the info panel has a test id like 'info-panel' or similar.
  // Since specific test IDs aren't provided in the prompt, we rely on visible text/roles.
  // We wait for the forecast section to appear.
  
  // Heuristic: Look for a list or grid that likely contains the forecast entries.
  // Often forecast entries are in a list. Let's try to find an element that indicates loading is done.
  // Or simply wait for the info panel to be visible and contain specific text.
  
  // Since we don't know the exact test IDs, we'll use a generic approach:
  // 1. Wait for the info panel to be visible.
  // 2. Wait for the forecast data to be present.
  
  // Let's assume the info panel is visible by default or becomes visible after click.
  // We'll look for a container that might hold the forecast.
  // A common pattern is a list of items. Let's try to find a list with 24 items or a header "Forecast".
  
  // Alternative: Use a timeout-based poll for the number of forecast entries if a specific selector is known.
  // Without specific selectors, we might check for the presence of a "Weather Forecast" heading.
  
  const infoPanel = page.getByRole('region', { name: /info|details/i }).first();
  await expect(infoPanel).toBeVisible();

  // Wait for the forecast section to appear. 
  // We'll look for a heading or text indicating forecast.
  const forecastHeading = page.getByText(/Weather Forecast|Forecast/i, { exact: false });
  await expect(forecastHeading).toBeVisible();

  // Wait for 24 forecast entries.
  // We need to identify the container holding the entries.
  // Let's assume the entries are in a list or grid within the info panel.
  // We'll try to count elements that look like forecast items.
  // This is tricky without specific test IDs. 
  // Let's assume there is a list with a specific role or class.
  // Or, we can look for a pattern in the text, e.g., "12:00", "13:00", etc.
  
  // A more robust way if test IDs are missing:
  // Wait for a specific number of elements with a common characteristic.
  // Let's try to find a list within the info panel.
  const forecastList = infoPanel.locator('ul, ol, div[role="list"]').first();
  
  // If a list is found, wait for 24 items.
  // If not, we might need to look for individual items.
  // Let's try to poll for the existence of at least some forecast items.
  
  // Heuristic: Look for time labels or temperature values.
  // Let's try to find elements that might be forecast cards or rows.
  // We'll poll for the count of such elements.
  
  // Since we don't know the exact selector, we'll try a broad search for common forecast indicators.
  // Let's assume the forecast entries are in a container with a specific class or role.
  // If we can't find a specific container, we might check for the presence of 24 distinct time slots.
  
  // Let's try to find a list of forecast items.
  // We'll use a generic selector for now and hope for the best, or use a text-based approach.
  
  // Better approach: Use the info panel's content to determine if the forecast is loaded.
  // We'll wait for a specific number of forecast entries to be visible.
  // Let's assume each entry has a unique time or temperature.
  
  // Let's try to find elements that contain a colon (time) or a degree symbol (temperature).
  // This is fragile.
  
  // Let's assume there is a test id for the forecast list, e.g., 'forecast-list'.
  // If not, we might need to use a more generic approach.
  
  // Given the complexity, let's try to find a list within the info panel and wait for 24 items.
  // If that fails, we'll try to find individual items.
  
  // Let's try to find a list with a role of 'list' or 'listbox' within the info panel.
  const forecastListContainer = infoPanel.locator('[role="list"], [role="listbox"]').first();
  
  // If no role-based list is found, try to find a div that looks like a list.
  const fallbackList = infoPanel.locator('div').filter({ has: page.locator('div, span').first() }).first();
  
  // We'll poll for the count of forecast items.
  // Let's assume each forecast item is a div or li.
  // We'll try to count elements within the forecast list container.
  
  // If the container is not found, we'll try to count elements with a specific pattern.
  
  // Let's try to find elements that contain a time string (HH:MM).
  const forecastItems = page.locator('div, li').filter({ hasText: /^\d{1,2}:\d{2}$/ });
  
  // Wait for 24 forecast items to be visible.
  await expect.poll(async () => {
    return await forecastItems.count();
  }).toBe(24);

  // Verify the clicked position is highlighted on the map.
  // This is hard to assert without a specific test ID for the marker.
  // We can try to find a marker or a popup at the clicked location.
  // Let's assume there's a marker or a popup.
  const marker = page.locator('.ol-marker, .ol-popup').first(); // OpenLayers classes
  await expect(marker).toBeVisible();
});
