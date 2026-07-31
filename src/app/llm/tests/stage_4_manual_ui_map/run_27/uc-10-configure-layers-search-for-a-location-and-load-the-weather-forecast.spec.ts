// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Hide Temperature layer
  // The layer switcher is visible by default. We need to find the checkbox for "Temperature".
  // Based on the UI map, operational layers are in a checkbox-list.
  // We assume the checkboxes have accessible names corresponding to the layer titles.
  const tempCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(tempCheckbox).toBeChecked(); // Verify precondition
  await tempCheckbox.click();

  // Step 2: Show Precipitation layer
  // Precipitation is initially hidden.
  const precipCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipCheckbox).not.toBeChecked(); // Verify precondition
  await precipCheckbox.click();

  // Assert layer visibility changes via helper
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Wait for clear button to appear (indicates input is non-empty)
  await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();

  // Step 4: Wait for results and select first
  // The results list appears after Nominatim returns results.
  // We wait for the first result item to appear.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // The map navigates to the selected location. We can verify this by checking
  // if a highlight appears or if the center changes significantly.
  // Using the helper to check for a highlight coordinate is robust.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Step 6: Wait for weather forecast to load in info panel
  // The forecast appears after clicking the map and loading.
  // The use case implies clicking a result navigates and potentially triggers a click or info load.
  // The UI map says weather-forecast appears after clicking the map-container.
  // However, the use case description says "selects the first result" and then "waits for info panel to load forecast".
  // Usually, geocoder selection centers the map. If the forecast doesn't auto-load, we might need to click the map.
  // But looking at the "Expected results": "info panel displays a weather forecast section with 24 entries".
  // And "weather-forecast" visibleWhen: "click" on "map-container".
  // Let's assume the geocoder selection might not click the map center in a way that triggers the forecast directly
  // unless the application logic ties them together.
  // Given the complexity, and that the forecast section is inside the info-panel which is visible,
  // we should check if the forecast entries appear.
  // If the forecast doesn't appear automatically, we might need to click the map.
  // Let's try to find the forecast entry. If it's not visible, we click the map to trigger it.
  
  const weatherForecastSection = page.getByTestId('weather-forecast');
  
  // Try to wait for forecast entries. If they don't appear, it might be because the map wasn't clicked.
  // The use case says "navigates the map... and loads the weather forecast".
  // If the geocoder action doesn't load it, we perform the click.
  const isForecastVisible = await weatherForecastSection.isVisible().catch(() => false);
  
  if (!isForecastVisible) {
    // Click the map to trigger the forecast load if it hasn't happened
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });
  }

  // Wait for weather forecast to be visible and have 24 entries
  await expect(weatherForecastSection).toBeVisible();
  
  // Assert 24 forecast entries
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);

  // Additional assertion: Precipitation toggle should be enabled (checked)
  // And Temperature toggle should be disabled (unchecked)
  await expect(precipCheckbox).toBeChecked();
  await expect(tempCheckbox).not.toBeChecked();
});
