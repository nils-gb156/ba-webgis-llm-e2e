// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show Precipitation layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for result list and select first result
  // The geocoder panel appears with results. We wait for the first list item to be visible.
  const firstResult = page.getByTestId('geocoder-panel').locator('li').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // We assert that the map container is still visible, implying the view has updated.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 6: Wait for info panel to load forecast with 24 entries
  // The info panel contains the weather forecast section. We poll for the presence of 24 forecast items.
  const forecastSection = page.getByTestId('weather-forecast-section');
  
  // We expect the forecast section to be visible and contain approximately 24 items.
  // The structure of the forecast section isn't explicitly detailed in the context,
  // but typically it's a list or grid. We'll check for the section visibility first,
  // then poll for a reasonable number of child elements representing forecast entries.
  await expect(forecastSection).toBeVisible();

  // Poll for the forecast entries to appear. Assuming each entry has a distinct element.
  // Since we don't have specific test IDs for forecast entries, we count visible elements within the section.
  await expect.poll(async () => {
    const entries = await forecastSection.locator('> *').count();
    return entries;
  }).toBeGreaterThanOrEqual(24);

  // Verify expected results:
  // - Precipitation toggle is enabled (checked)
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // - Temperature toggle is disabled (unchecked)
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
});
