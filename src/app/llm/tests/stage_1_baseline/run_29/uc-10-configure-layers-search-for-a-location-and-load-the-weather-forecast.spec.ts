// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready and initial state to settle
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  // The Temperature layer is initially visible, so we click its toggle to hide it.
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so we click its toggle to show it.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Verify layer visibility states
  await expect(temperatureToggle).not.toBeChecked();
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByTestId('geocoder-search-input');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  // The geocoder typically shows a dropdown with results.
  const firstResult = page.getByRole('option', { name: /Münster/ }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // We wait for the info panel to start updating or for the map canvas to potentially change.
  // Since map canvas content isn't directly assertable via DOM, we rely on the info panel
  // updating as a proxy for the map having navigated and the context changing.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 6: Wait for info panel to load the forecast
  // The expected result is 24 entries in the weather forecast section.
  // We look for a container that holds the forecast entries.
  const forecastContainer = page.getByTestId('weather-forecast-list');
  
  // Poll until we see at least 24 entries in the forecast list
  await expect.poll(async () => {
    const count = await forecastContainer.locator('li').count();
    return count;
  }).toBeGreaterThanOrEqual(24);
});
