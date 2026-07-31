// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-toggle-temperature');
  await expect(temperatureToggle).toBeVisible();
  await temperatureToggle.click();
  await expect(temperatureToggle).toHaveAttribute('aria-pressed', 'false');

  // 2. Show Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-toggle-precipitation');
  await expect(precipitationToggle).toBeVisible();
  await precipitationToggle.click();
  await expect(precipitationToggle).toHaveAttribute('aria-pressed', 'true');

  // 3. Search for a location
  const searchField = page.getByTestId('geocoder-search-field');
  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  // 4. Wait for result list and select first result
  const firstResult = page.getByRole('option', { name: /Münster/ }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for map to navigate (we can't assert map canvas directly, but we can assert
  //    that the info panel starts loading or that the geocoder result is cleared/processed)
  //    Since we can't assert map position without helpers, we wait for the info panel to update
  //    which implies navigation and data loading.

  // 6. Wait for info panel to load the forecast with 24 entries
  const forecastSection = page.getByTestId('info-panel-forecast');
  await expect(forecastSection).toBeVisible();
  
  // Assert that the forecast section contains 24 entries
  const forecastEntries = forecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);
});
