// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // 2. Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Verify layer visibility through the map model
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The results use a custom list with test ids, not standard ARIA roles.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  const firstResult = geocoderPanel.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location (highlight appears)
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // 6. Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // The info panel displays 24 forecast entries; verify the section contains them.
  const entries = weatherForecastSection.locator('[data-testid="weather-forecast-entry"]');
  await expect(entries).toHaveCount(24);
});
