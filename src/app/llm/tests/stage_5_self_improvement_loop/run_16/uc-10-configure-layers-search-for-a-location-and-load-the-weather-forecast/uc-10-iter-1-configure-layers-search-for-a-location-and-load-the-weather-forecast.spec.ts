// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map model to be exposed before interacting with layer toggles.
  await page.waitForFunction(() => {
    return (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap !== undefined;
  });

  // 1. Hide the Temperature overlay layer.
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // 2. Show the Precipitation overlay layer.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // 3. Search for 'Münster' using the geocoder.
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Select the first result from the geocoder panel.
  //    The results are rendered as listitems with data-testid, not as ARIA options.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the searched location.
  //    The Precipitation layer should be rendered (confirms the map state has updated).
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 6. Wait for the info panel to load the weather forecast with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // The forecast section should contain exactly 24 forecast entries.
  const forecastEntries = weatherForecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);
});
