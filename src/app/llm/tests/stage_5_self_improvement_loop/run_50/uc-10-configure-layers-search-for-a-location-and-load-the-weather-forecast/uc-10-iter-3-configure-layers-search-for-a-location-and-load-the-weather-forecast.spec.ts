// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  // Chakra UI checkboxes intercept pointer events on the visual control, so we use force: true
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer states via map model
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The results are rendered as listitems with data-testid attributes, not as ARIA options.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel.getByTestId('geocoder-result-item-0')).toBeVisible();
  await geocoderPanel.getByTestId('geocoder-result-item-0').click();

  // 5. Wait for the map to navigate to the selected location
  // The info panel should update its content to show the forecast for the selected location.
  // Initially it says "Click on the map to load a forecast."
  // After navigation, the paragraph text should change (e.g., to the date or a location name).
  // We assert that the info panel no longer contains the initial placeholder text.
  await expect.poll(() => page.getByTestId('info-panel').locator('p').first().textContent()).not.toBe('Click on the map to load a forecast.');

  // 6. Wait for the info panel to load the forecast with 24 entries
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  await expect.poll(() => weatherForecastSection.getByTestId('weather-forecast-entry').count()).toBe(24);
});
