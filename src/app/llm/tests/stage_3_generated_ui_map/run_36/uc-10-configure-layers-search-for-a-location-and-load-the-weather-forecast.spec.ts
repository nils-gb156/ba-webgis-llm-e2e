// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The layer switcher is visible by default. We find the Temperature layer entry and click its toggle.
  // Since Chakra UI renders the input hidden, we force-click the checkbox role.
  const temperatureLayerToggle = page
    .getByRole('checkbox', { name: 'Temperature' })
    .first();
  await temperatureLayerToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  // Precipitation is initially hidden, so its checkbox should be unchecked.
  const precipitationLayerToggle = page
    .getByRole('checkbox', { name: 'Precipitation' })
    .first();
  await precipitationLayerToggle.click({ force: true });

  // Step 3: Search for 'Münster' using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We poll the zoom level and center to ensure the map view has updated.
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  const initialCenter = await getMapCenter(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

  // Step 6: Wait for the info panel to load the forecast.
  // The info panel is visible by default. We look for the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected results verification.

  // Verify layer states via map model helpers.
  // Temperature should NOT be rendered.
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  // Precipitation SHOULD be rendered.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the info panel displays a weather forecast section with 24 entries.
  // We count the weather forecast entries.
  const weatherEntries = page.getByTestId('weather-forecast-entry');
  await expect(weatherEntries).toHaveCount(24);
});
