// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and initial state to settle
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  // The Temperature layer is initially visible, so its toggle is "on".
  // We click it to turn it "off".
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();

  // Step 2: Show the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so its toggle is "off".
  // We click it to turn it "on".
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();

  // Verify layer states after toggling
  // Temperature should now be hidden (unchecked)
  await expect(temperatureToggle).not.toBeChecked();
  // Precipitation should now be visible (checked)
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByTestId('geocoder-search-field');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select the first result
  // The geocoder typically shows a dropdown list of suggestions
  const firstResult = page.getByRole('option', { name: 'Münster', exact: true }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // Since we don't have map helper functions, we wait for the info panel
  // to update or for a loading state to disappear, implying navigation.
  // We'll poll the info panel content to ensure it reflects the new location context.
  // Or simply wait for a short period if no specific locator changes.
  // However, the prompt says "info panel displays a weather forecast section".
  // Let's wait for the info panel to show some content related to the forecast.
  await expect(page.getByTestId('info-panel')).toContainText('Forecast');

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  // We need to verify the info panel displays a weather forecast section with 24 entries.
  // Assuming the forecast entries are rendered as list items or similar within the info panel.
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
