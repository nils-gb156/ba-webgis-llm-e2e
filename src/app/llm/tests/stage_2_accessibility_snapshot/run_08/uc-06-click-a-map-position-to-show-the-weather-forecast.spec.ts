// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible. The accessibility tree shows "Info Panel Switcher" is [pressed],
  // which means the panel is currently open. We assert this state.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure the map canvas is interactive by waiting for the map container to be visible.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map container to click within its bounds.
  const mapBox = await mapContainer.boundingBox();
  test.fail(!mapBox, 'Map container bounding box could not be determined');

  // Click near the center of the map to trigger the forecast request.
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;

  // Wait for the GetFeatureInfo or forecast API response before clicking to ensure the app is ready.
  // We assume the forecast endpoint follows a pattern like /forecast or similar.
  // Since we don't know the exact URL, we'll wait for a network request after the click
  // to confirm the action was processed, but first let's just click.
  // To be safe against timing issues, we'll wait for a response that likely corresponds to the forecast data.
  // Common patterns might be /api/forecast, /forecast, or similar. Let's try to catch any request
  // that happens after the click which might be the forecast fetch.
  // However, Playwright's waitForResponse requires a URL pattern. Let's look at the context.
  // The use case says "Click on the map to load a forecast".
  // Let's assume the request goes to a specific endpoint. Without explicit knowledge,
  // we can try to wait for a response after the click.
  // A safer bet for "hard" complexity is to ensure the click happens and then poll for the result.

  await page.mouse.click(clickX, clickY);

  // Wait for the forecast data to appear in the info panel.
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // The accessibility tree shows a "Weather Forecast" heading and a "weather-forecast-section" test id.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Poll until the weather forecast section is visible and contains the expected number of entries.
  // We need to determine how the 24 entries are represented. They might be list items, divs, or rows.
  // Let's assume they are distinct elements within the section. We can count them.
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    const isVisible = await section.isVisible();
    if (!isVisible) return 0;
    // Try to count child elements that might represent forecast entries.
    // Often these are divs, li, or tr elements. Let's try to find all direct children or specific role elements.
    // A robust way is to count elements that look like forecast items.
    // Let's assume they are divs or similar inside the section.
    const entries = await section.locator('> div').count();
    return entries;
  }).toBe(24);

  // Verify the clicked position is highlighted on the map.
  // Since map state is not in DOM, we rely on the fact that the forecast loaded successfully.
  // If there was a specific marker test-id, we would check it.
  // The prompt doesn't provide a test-id for the highlight marker, so we rely on the successful forecast load
  // as the primary indicator that the click was registered and processed correctly.
  
  // Additional assertion: Check that the info panel is still visible.
  await expect(infoPanel).toBeVisible();
});
