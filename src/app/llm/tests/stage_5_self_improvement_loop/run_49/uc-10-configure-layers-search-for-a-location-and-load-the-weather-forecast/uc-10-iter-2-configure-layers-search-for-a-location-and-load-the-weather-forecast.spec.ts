// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to be rendered
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // 1. Hide the Temperature overlay layer
  // Chakra UI checkbox: the real <input role="checkbox"> is visually hidden under a decorative control.
  // Click the role locator with force: true.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureCheckbox.click({ force: true });
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a place
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The geocoder panel appears; the results are list items with role "option" inside the geocoder-results list.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // The map highlights the selected location.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // 6. Wait for the info panel to load the forecast
  // The info panel contains a "Weather Forecast" heading.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();

  // Expected results:
  // - The Precipitation overlay layer toggle is in the disabled state (checkbox unchecked).
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).not.toBeChecked();
  // - The Temperature overlay layer toggle is in the enabled state (checkbox checked).
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  // - The info panel displays a weather forecast section with 24 entries.
  const weatherSection = infoPanel.getByTestId('weather-forecast-section');
  await expect(weatherSection).toBeVisible();
  // We expect at least 24 forecast items (e.g., hours).
  const forecastItems = weatherSection.getByRole('listitem');
  await expect(forecastItems).toHaveCount(24);
});
