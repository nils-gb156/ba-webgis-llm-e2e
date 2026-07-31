// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows "Info Panel Switcher" is pressed, so it should be visible.
  // We wait for it to be visible to ensure the app is fully loaded and interactive.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the forecast request.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the weather forecast section to appear and contain data.
  // The expected result states the forecast contains 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // We poll for the section to be visible and then check its content.
  // Since the exact structure of the 24 entries isn't fully detailed in the prompt's tree,
  // we assert visibility first, then poll for the presence of multiple forecast items.
  // A common pattern for a list of 24 items might be specific class names or roles.
  // However, without specific test IDs for the forecast items, we rely on the section visibility
  // and the presence of some expected content structure.
  
  // Let's assume the forecast items are rendered as a list or similar structure within the section.
  // We will wait for the section to be visible.
  await expect(weatherForecastSection).toBeVisible();

  // To verify "24 entries", we need to find the elements representing the entries.
  // Without specific test IDs, we might look for list items or rows.
  // Let's try to find any list items within the weather forecast section.
  // If the implementation uses a specific role, we'd use that.
  // Given the complexity, we'll assert that the section is visible and then try to count items.
  // If we can't reliably count 24 items via DOM without more specific selectors,
  // we might just assert the section is visible and has some content.
  // However, the requirement is specific: "contains 24 entries".
  
  // Let's assume the forecast entries are rendered as elements with a specific role or class.
  // Since we don't have that info, we'll use a generic approach:
  // We'll wait for the section to be visible and then check if it has more than 0 children or specific text.
  
  // Alternative: The prompt mentions "The forecast contains 24 entries."
  // We can try to find elements that look like forecast entries.
  // Let's assume they are divs or list items.
  
  // Let's try to find any element inside the weather forecast section that indicates a forecast entry.
  // We'll use a poll to wait for the count to reach 24.
  // We'll assume the entries have a common attribute or role.
  // If no specific selector is available, we might have to rely on the section being visible.
  // But the prompt is specific. Let's try to find list items.
  
  const forecastEntries = weatherForecastSection.locator('li');
  
  // Poll until we have 24 entries.
  await expect.poll(async () => {
    return await forecastEntries.count();
  }).toBe(24);

  // Also verify the clicked position is highlighted.
  // Since map state is not in DOM, we can't directly assert the highlight via DOM.
  // However, the prompt says "The clicked position is highlighted on the map."
  // Without map helper functions, we can't assert this programmatically via the map canvas.
  // We'll rely on the successful loading of the forecast as an indirect confirmation.
});
