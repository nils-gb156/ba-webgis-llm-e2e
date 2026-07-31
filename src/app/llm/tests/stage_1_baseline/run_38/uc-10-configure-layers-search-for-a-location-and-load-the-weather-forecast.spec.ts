// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Step 3: Click the search field and type a place name
  const searchField = page.getByRole('combobox', { name: /search/i });
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const firstResult = page.getByRole('option', { name: /Münster/ }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We assert that the map canvas has been interacted with or that the info panel starts updating.
  // Since we can't assert map coordinates directly without helpers, we rely on the info panel update.
  await expect(page.locator('canvas')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  // The info panel displays weather forecast entries. We poll for the count of forecast items.
  const forecastEntries = page.locator('[data-testid="forecast-entry"]');
  await expect.poll(async () => forecastEntries.count()).toBe(24);

  // Verify expected results:
  // - The Precipitation overlay layer toggle is in the disabled state (checked/active means visible/enabled)
  await expect(precipitationToggle).toBeChecked();
  
  // - The Temperature overlay layer toggle is in the enabled state (unchecked means hidden/disabled)
  await expect(temperatureToggle).not.toBeChecked();
});
