// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to settle
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // 1. Hide the Temperature overlay layer
  // The layer switcher is visible by default. We find the Temperature layer row.
  // The toggle is a checkbox. We click it to uncheck it.
  const temperatureLayerRow = page.getByRole('row', { name: 'Temperature' }).first();
  const temperatureToggle = temperatureLayerRow.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // 2. Show the Precipitation overlay layer
  const precipitationLayerRow = page.getByRole('row', { name: 'Precipitation' }).first();
  const precipitationToggle = precipitationLayerRow.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Verify layer states via map model (DOM state might lag or be ambiguous)
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // 4. Wait for results and select the first one
  // The geocoder results panel becomes visible when results are available
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Wait for the first result item to appear
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // We check that the map center has changed or simply wait for the info panel to update
  // Since we don't have the initial center, we wait for the weather forecast to start loading
  // or for the map to stabilize. A safe bet is to wait for the info panel weather section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // 6. Verify the info panel displays a weather forecast with 24 entries
  // The entries are typically listed inside the weather-forecast-section
  const weatherEntries = page.getByTestId('weather-forecast-entry');
  await expect(weatherEntries).toHaveCount(24);
});
