// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByLabel('Search');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  const firstResult = page.getByRole('option').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate (poll for map center change or just wait for stability)
  // Since we don't have helper functions, we wait for the info panel to start updating or simply wait
  // A simple timeout might be brittle, but without map helpers, we rely on the info panel load.
  // Let's wait for the info panel to show content related to the location or forecast.
  await page.waitForTimeout(2000); // Allow map navigation and initial load

  // Step 6: Wait for info panel to load the forecast with 24 entries
  // The info panel should display a weather forecast section with 24 entries.
  // We look for a container that likely holds the forecast list.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // Assert that there are 24 entries in the forecast
  const forecastEntries = forecastSection.locator('[data-testid="weather-forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);
});
