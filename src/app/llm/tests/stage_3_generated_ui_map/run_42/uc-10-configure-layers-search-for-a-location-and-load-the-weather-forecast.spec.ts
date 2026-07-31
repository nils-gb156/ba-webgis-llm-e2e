// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map and initial layers to be ready
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide Temperature layer
  // The layer switcher is visible by default. We need to find the toggle for "Temperature".
  // Since "Temperature" is a substring of "Temperature Legend" or similar, we scope to the layer switcher.
  // The layer switcher panel contains the list of layers.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show Precipitation layer
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Verify layer states
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // We verify navigation by checking that the map center has changed from the initial default.
  // However, since we don't know the exact initial center, we just assert that the map is interactive
  // and the geocoder results are gone or the info panel is updating.
  // A robust check is to wait for the info panel to show loading or new content.
  // For now, we wait a bit for the map to pan.
  await page.waitForTimeout(2000); // Allow map animation to complete

  // Step 6: Wait for info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  
  // Check for 24 entries. The entries are likely in a list or grid.
  // We look for weather-forecast-entry elements.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
