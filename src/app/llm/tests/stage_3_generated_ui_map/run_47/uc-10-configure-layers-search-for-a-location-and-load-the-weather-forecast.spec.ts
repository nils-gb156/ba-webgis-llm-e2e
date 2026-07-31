// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Hide the Temperature overlay layer
  // The layer switcher is visible by default. We need to find the toggle for "Temperature".
  // Based on the UI map, we don't have specific test ids for individual layer toggles in the TOC,
  // so we rely on the accessible name. The layer switcher panel is visible.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Verify Temperature is hidden
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Verify Precipitation is rendered
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const geocoderResults = page.getByTestId('geocoder-results');
  await expect(geocoderResults).toBeVisible();

  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // We verify the map center has changed from the initial position.
  // Since we don't know the exact coordinates of Münster in EPSG:3857,
  // we just assert that the map is no longer at the initial default view.
  // A simpler assertion is to wait for the info panel to update or for a specific visual cue.
  // However, the prompt asks to verify the map navigates. We can check the zoom/center if we had helpers.
  // We have `getMapCenter` helper. Let's capture initial center.
  const initialCenter = await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    const center = map?.olMap.getView().getCenter();
    return center && center.length >= 2 ? [center[0], center[1]] : undefined;
  });

  // Wait for the map to move. We poll the center until it changes significantly.
  await expect.poll(async () => {
    const currentCenter = await page.evaluate(() => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      const center = map?.olMap.getView().getCenter();
      return center && center.length >= 2 ? [center[0], center[1]] : undefined;
    });
    if (!initialCenter || !currentCenter) return false;
    return currentCenter[0] !== initialCenter[0] || currentCenter[1] !== initialCenter[1];
  }).toBe(true);

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: Info panel displays a weather forecast section with 24 entries.
  // We can count the forecast entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
