// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: info panel visible, map canvas interactive
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click on a position on the map canvas
  // The map is a canvas, so we click directly on the container element.
  // We use a position that is likely over land (e.g., Germany) to ensure a forecast is returned.
  // Based on the screenshot, clicking near the center of the visible map area should work.
  await page.getByTestId('map-container').click({ position: { x: 600, y: 300 } });

  // Step 2: Wait for the info panel to load the forecast
  // Expected: The clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Expected: The info panel displays a weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Expected: The forecast contains 24 entries
  // The forecast entries are rendered as list items within the weather-forecast-section.
  // We count the list items inside the section.
  const forecastSection = page.getByTestId('weather-forecast-section');
  // The forecast entries are likely rendered as a list. We look for list items or similar elements.
  // Based on typical structures, we might see a list of divs or li elements.
  // Let's try to count the number of elements that look like forecast entries.
  // A common pattern is a list of items. Let's try to count `li` elements or similar.
  // If the section has a heading and then 24 items, we can try to count the items.
  // Let's assume the entries are `li` elements or `div` elements with a specific class or structure.
  // Without more info, let's try to count the number of elements that are children of the section
  // excluding the heading.
  // A safer bet is to check if the section is visible and then check for the number of entries.
  // Let's try to find the list of entries. If the section has a list, we can count the list items.
  // Let's try to count the number of `li` elements inside the weather-forecast-section.
  const entries = forecastSection.locator('li');
  await expect(entries).toHaveCount(24);
});
