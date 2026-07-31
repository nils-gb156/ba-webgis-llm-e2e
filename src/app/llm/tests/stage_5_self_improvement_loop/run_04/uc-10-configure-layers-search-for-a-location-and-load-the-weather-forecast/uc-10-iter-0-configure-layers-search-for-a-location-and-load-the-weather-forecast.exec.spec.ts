// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureToggle = page
    .getByRole('list', { name: 'Operational layers' })
    .getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer
  const precipitationToggle = page
    .getByRole('list', { name: 'Operational layers' })
    .getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.fill('Münster');

  // 4. Select the first result from the geocoder panel
  const geocoderPanel = page.getByRole('region', { name: 'geocoder' });
  await expect(geocoderPanel.getByRole('listitem').first()).toBeVisible();
  await geocoderPanel.getByRole('listitem').first().click();

  // 5. Wait for the map to navigate to the selected location
  // The map zooms in; a zoom level > 5 indicates navigation to a city.
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap?.olMap.getView().getZoom())).toBeGreaterThan(5);

  // 6. Wait for the info panel to load the weather forecast with 24 entries
  const infoPanel = page.getByRole('region', { name: 'info-panel' });
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();

  // The forecast section contains 24 hour entries. Wait for the section to have the expected number of items.
  const weatherSection = infoPanel.getByRole('region', { name: 'weather-forecast-section' });
  await expect.poll(() => weatherSection.getByRole('listitem').count()).toBe(24);
});
