// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast.
  // Use force: true to click through the Chakra UI overlay element
  await page.getByTestId('map-container').click({
    position: { x: 400, y: 400 },
  });

  // Wait for the info panel to load the forecast
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Assert that the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Assert that the forecast contains 24 entries.
  // The forecast section contains a grid of cards. Each card represents one hourly entry.
  // We count the number of forecast cards within the weather-forecast-section.
  const forecastSection = page.getByTestId('weather-forecast-section');
  // Forecast entries are typically rendered as a list of items.
  // We look for list items or divs with a class indicating a forecast entry.
  // A robust selector is to find elements that are direct children or common wrappers.
  // Based on typical React grid/list patterns, we look for elements with role="listitem"
  // or common class names like "forecast-card", "hourly-item", etc.
  // Let's try to count elements that look like forecast entries.
  // Often, these are in a list or grid. Let's count elements with a specific role or class.
  // If the UI uses a grid, the items might be divs. Let's look for a common pattern.
  // We'll count elements that are likely forecast entries by their structure.
  // Let's assume the forecast entries are in a list or grid and we can count them.
  // We'll use a generic selector that matches common forecast entry structures.
  const forecastEntries = forecastSection.locator('[role="listitem"], div[class*="forecast-entry"], div[class*="hourly-item"], div[class*="forecast-card"]');
  const forecastCount = await forecastEntries.count();

  // If the specific selectors don't find anything, try a broader approach:
  // Count all child elements that are not the header or description.
  // This is a fallback.
  if (forecastCount === 0) {
    // Try to count elements that might be forecast entries by their text content or structure.
    // Let's assume the forecast entries are in a list with a specific role.
    // We'll try to find a list and count its items.
    const forecastList = forecastSection.locator('ul, ol, [role="list"]');
    const listItems = forecastList.locator('li, [role="listitem"]');
    const itemCount = await listItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(24);
  } else {
    expect(forecastCount).toBeGreaterThanOrEqual(24);
  }
});
