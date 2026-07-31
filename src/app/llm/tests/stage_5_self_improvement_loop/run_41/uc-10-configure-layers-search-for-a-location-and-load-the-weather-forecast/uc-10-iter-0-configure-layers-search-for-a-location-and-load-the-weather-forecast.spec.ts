// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The layer switcher is already visible. The Temperature checkbox is checked.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Assert layer state: Temperature should no longer be rendered, Precipitation should be rendered.
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a location using the geocoder.
  await page.getByTestId('geocoder-input').fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  // The geocoder panel appears with search results.
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();

  // Select the first result from the geocoder panel.
  // The first result is typically the most relevant match.
  const firstResult = page.getByTestId('geocoder-panel').getByRole('option', { name: 'Münster', exact: true }).first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // The map will pan/zoom to the selected place. We can assert the map center has changed
  // or simply wait for the info panel to update, which implies navigation.
  // A simple approach is to wait for the info panel to show content.
  await expect(page.getByTestId('info-panel')).toContainText('Weather Forecast');

  // Step 6: Wait for the info panel to load the forecast.
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // We can assert the presence of the weather forecast section and then check for the number of entries.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // The forecast entries are likely in a list or grid. We need to count them.
  // Assuming each entry has a consistent role or test-id, or we can count elements within the section.
  // Without specific test-ids for forecast entries, we might count child elements or use a more general assertion.
  // Let's assume the entries are list items or have a common class/role.
  // A robust way is to wait for the number of forecast items to be 24.
  // We'll try to find elements that represent a forecast entry.
  // If there's no specific role, we might need to rely on the structure.
  // For now, let's assert the section is visible and contains some content, then poll for 24 entries.
  // We'll assume each forecast hour/day has a distinct element within the weather-forecast-section.
  // A common pattern is a list of items. Let's try to find all list items or divs within the section.
  // Since we don't have a specific test-id for forecast entries, we'll count elements by role or tag if possible.
  // Let's assume they are list items.
  await expect.poll(async () => {
    const weatherSection = page.getByTestId('weather-forecast-section');
    await weatherSection.waitFor({ state: 'visible' });
    // Try to count list items or other common elements representing forecast entries.
    // If they are not list items, this might need adjustment.
    const entries = weatherSection.getByRole('listitem');
    const count = await entries.count();
    return count;
  }).toBe(24);
});
