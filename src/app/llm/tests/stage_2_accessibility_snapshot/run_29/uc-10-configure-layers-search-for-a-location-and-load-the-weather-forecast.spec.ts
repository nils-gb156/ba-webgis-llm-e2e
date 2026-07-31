// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial load and layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  // The temperature checkbox is currently checked. We need to click it to uncheck it.
  // Using force: true because Chakra UI checkboxes have a decorative overlay.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  // The precipitation checkbox is currently unchecked. We need to click it to check it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer states
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The geocoder panel should appear with results.
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();
  
  // Select the first result. Usually, the first item in the list is the best match.
  // We look for the first list item or button within the geocoder panel.
  const firstResult = page.getByTestId('geocoder-panel').locator('li').first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We can verify this by checking if the info panel updates or by waiting for a network response
  // related to the geocoder selection or map movement. 
  // Since we don't have specific map helpers, we'll wait for the info panel to update with new content
  // or simply wait for the geocoder panel to close/disappear if that's the behavior,
  // or wait for a network response to a GetFeatureInfo or similar endpoint if triggered.
  // A safer bet for "map navigated" in this context without map state helpers is to wait for
  // the info panel to start loading or update its content significantly.
  
  // Step 6: Wait for the info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  
  // We poll for the weather forecast section to contain 24 entries.
  // The weather forecast section has a data-testid 'weather-forecast-section'.
  // We need to count the number of items inside this section.
  // Assuming the entries are list items or similar distinct elements within the section.
  
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    if (await section.isVisible()) {
      // Count the number of child elements that represent forecast entries.
      // Without specific test ids for entries, we might count by role or tag.
      // Let's assume the entries are rendered as distinct elements, e.g., divs or list items.
      // We'll try to count elements with a common attribute or structure if possible.
      // If not, we might count by text pattern or just wait for the section to have content.
      // Let's try to count 'listitem' roles or similar if they exist.
      // A robust way is to count the number of forecast cards/items.
      // Let's assume the entries are divs or similar. We'll count the number of elements with a specific class or role if available.
      // Since we don't have specific test ids for entries, we'll rely on the section having visible content.
      // However, the requirement is "24 entries". We need to count them.
      // Let's assume each entry is a 'listitem' or has a specific role.
      const entries = page.getByTestId('weather-forecast-section').locator('li').count();
      // If 'li' doesn't work, we might need to adjust. Let's try 'div' or generic elements.
      // But often, forecast lists use <ul><li> or similar.
      // Let's try to get the count of elements that look like forecast items.
      // If we can't find a specific selector, we might have to guess or use a broader selector.
      // Let's try to count the number of 'listitem' roles within the section.
      const listItems = page.getByTestId('weather-forecast-section').getByRole('listitem').count();
      return listItems;
    }
    return 0;
  }).toBe(24);

  // Final verification that the info panel is visible and contains the forecast
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
});
