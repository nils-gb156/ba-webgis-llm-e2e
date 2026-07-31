// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  // The checkbox "Temperature" is a substring of "UV-Index", so we scope to the layer list
  const layerList = page.getByRole('list', { name: 'Operational layers' });
  const temperatureCheckbox = layerList.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = layerList.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Verify layer visibility via map model helpers
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // The first result is "Münster, North Rhine-Westphalia, Germany"
  // The geocoder results are rendered as a list. Each item has a test-id like 'geocoder-result-item-0'.
  // We can click the first result item directly.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We assert that the info panel shows the location name, which indicates the map has navigated.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByText('Location: Münster, DE')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // The forecast entries are rendered with a specific test-id.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
