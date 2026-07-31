// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to settle
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // 1. Hide the Temperature overlay layer
  // The layer switcher is visible by default. We locate the Temperature layer toggle.
  // Assuming the layer items have test ids or accessible names, we use getByRole with exact name.
  // If specific test ids for layer toggles are not provided, we rely on the accessible name of the toggle button.
  // Based on the UI map, we don't have specific test ids for individual layer toggles, so we use getByRole.
  // We need to scope to the layer switcher to avoid ambiguity.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Click the Temperature layer toggle to hide it
  // Note: Chakra UI checkboxes/switches need force: true
  const tempToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(tempToggle).toBeChecked();
  await tempToggle.click({ force: true });
  await expect(tempToggle).not.toBeChecked();
  
  // Verify via map model that Temperature is no longer rendered
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer
  // Precipitation is initially hidden, so the checkbox should be unchecked
  const precipToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipToggle).not.toBeChecked();
  await precipToggle.click({ force: true });
  await expect(precipToggle).toBeChecked();

  // Verify via map model that Precipitation is rendered
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for results and select the first one
  // The results panel should appear
  await expect(page.getByTestId('geocoder-results')).toBeVisible();
  
  // Select the first result
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate
  // We can check that the map center has changed or that the loading state is gone.
  // Since we don't have a "loading" indicator test id, we wait for the geocoder results to disappear
  // and potentially check the map center if we had a known target.
  // A robust way is to wait for the info panel to start updating or for the geocoder results to close.
  await expect(page.getByTestId('geocoder-results')).toBeHidden();

  // 6. Wait for the info panel to load the forecast
  // The info panel should contain a weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
  
  // Verify the weather forecast has 24 entries
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
