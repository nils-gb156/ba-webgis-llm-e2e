// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });

  // 2. Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });

  // Verify layer visibility state
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The geocoder panel typically appears with a list of suggestions.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result. The result items usually have a specific role or text.
  // Assuming the first item in the list is the one we want.
  const firstResult = geocoderPanel.getByRole('option').first();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location.
  // The map center should change from the initial extent to the searched location.
  // We can assert this by checking the map center via the helper.
  // Initial center is roughly [4.5e6, 5.3e6] (North-West Germany). Münster is roughly [5.8e6, 5.6e6].
  // We'll just wait for the panel to update or the map to settle.
  // A simple way is to wait for the info panel to update its content or for the geocoder panel to close.
  await expect(geocoderPanel).not.toBeVisible();

  // 6. Wait for the info panel to load the forecast.
  // The info panel should now show the weather forecast.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // The forecast section should be visible and contain 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Check for the presence of 24 forecast entries.
  // The entries are likely list items or similar within the weather forecast section.
  // We'll poll for the count of forecast entries.
  const forecastEntries = weatherForecastSection.getByRole('listitem');
  await expect.poll(async () => forecastEntries.count()).toBe(24);
});
