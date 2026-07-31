// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The context indicates the Info Panel Switcher is pressed, so it should be visible.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger a forecast request.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the info panel to update with the weather forecast section.
  // The expected result is that the forecast contains 24 entries.
  // We poll the info panel for the presence of the weather forecast section
  // and then check the number of entries.
  await expect.poll(async () => {
    const weatherSection = page.getByTestId('weather-forecast-section');
    if (!(await weatherSection.isVisible())) {
      return 0;
    }
    // Count the number of forecast entries. Assuming each entry is a distinct element
    // inside the weather-forecast-section. The exact structure isn't fully specified,
    // but typically it might be a list of items or cards.
    // Let's assume the entries are direct children or have a specific role.
    // If the structure is a list, we might count list items.
    // Without specific test IDs for entries, we might rely on the text content or role.
    // However, the prompt says "The forecast contains 24 entries".
    // Let's try to count elements that look like forecast entries.
    // A common pattern is a list of divs or cards.
    // Let's assume there's a container for the list of forecasts.
    // If no specific test id is available for the entries, we might need to infer.
    // Let's look at the accessibility tree again.
    // There is no specific structure for the forecast entries in the provided tree.
    // We will assume that the `weather-forecast-section` contains 24 items.
    // We can try to count elements with a common class or role if available.
    // Since we don't have test IDs for the entries, we might have to rely on the fact
    // that the section becomes visible and then check for a specific number of child elements
    // that represent the forecast data.
    // Let's assume each forecast entry is a `div` or similar block element inside the section.
    // This is a bit fragile, but without more info, it's a reasonable approach.
    // Alternatively, we can check if the section contains text that implies 24 hours/days.
    // But "24 entries" suggests a countable list.
    // Let's try to count the number of elements inside the weather-forecast-section.
    // We'll assume they are direct children or have a specific role like 'listitem'.
    // If they are just divs, we count divs.
    const entries = await page.getByTestId('weather-forecast-section').locator('> *').count();
    return entries;
  }).toBe(24);

  // Verify the clicked position is highlighted on the map.
  // This is tricky because the map is a canvas.
  // The prompt mentions "The clicked position is highlighted on the map."
  // Without a specific test ID for the marker, we might not be able to assert this directly via DOM.
  // However, the prompt says "Map state via helper functions (only if provided in the prompt)".
  // No helper functions were provided in the prompt.
  // Therefore, we cannot assert the map state directly.
  // We will rely on the info panel update as the primary indicator that the click was processed.
  // The highlighting on the map is a side effect that we cannot easily verify without helpers.
  // We will assume that if the forecast appears, the map state was updated correctly.
});
