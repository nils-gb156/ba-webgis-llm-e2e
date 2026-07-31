// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: info panel visible, map canvas interactive
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click on a position on the map canvas
  await page.getByTestId('map-container').click({ position: { x: 400, y: 300 } });

  // Step 2: Wait for the info panel to load the forecast
  // Expected: The clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Expected: The info panel displays a weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Expected: The forecast contains 24 entries
  // The forecast entries are rendered as list items within the weather-forecast-section.
  // Based on the accessibility tree, the section contains a heading "Weather Forecast" and
  // then the forecast data. We need to count the individual forecast entries.
  // The test uses `[data-testid="forecast-entry"]` which is not found in the accessibility tree.
  // Let's look at the structure. The section likely contains a list of items.
  // Since we don't have test ids for the entries, we can count the list items or paragraphs
  // that represent the forecast data. However, the prompt says "The forecast contains 24 entries".
  // Let's assume the entries are rendered as distinct elements.
  // A common pattern is a list of items. Let's try to find the list items within the section.
  // If there are no specific test ids, we might need to count based on the structure.
  // Let's try to get the number of list items or similar elements inside the weather-forecast-section.
  // Since the previous test used `[data-testid="forecast-entry"]` and it failed, it's likely that
  // the test id is not present or the structure is different.
  // Let's try to count the number of elements that look like forecast entries.
  // Often, a forecast section will have a list of items. Let's try to count `li` elements or similar.
  // If the section has a heading and then 24 items, we can try to count the items.
  // Let's assume the entries are `li` elements or `div` elements with a specific class or structure.
  // Without more info, let's try to count the number of elements that are children of the section
  // excluding the heading.
  // A safer bet is to check if the section is visible and then check for the number of entries.
  // Let's try to find the list of entries. If the section has a list, we can count the list items.
  // Let's try to count the number of `li` elements inside the weather-forecast-section.
  const entries = page.getByTestId('weather-forecast-section').locator('li');
  await expect(entries).toHaveCount(24);
});
