// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // 2. Show the Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // 3. Search for 'Münster'
  const searchField = page.getByLabel('Search');
  await searchField.click();
  await searchField.fill('Münster');

  // 4. Wait for result list and select the first result
  const firstResult = page.getByRole('option', { name: /Münster/, exact: false }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // Since we don't have map helpers, we assert that the info panel starts updating/loading
  // or simply wait for the network request associated with the geocoder result processing.
  // We'll wait for the info panel content to change or appear, implying navigation/processing.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // 6. Wait for the info panel to load the forecast with 24 entries
  // The forecast entries are likely in a list within the info panel.
  // We poll for the number of forecast entries to reach 24.
  await expect.poll(async () => {
    const forecastList = page.getByTestId('forecast-list');
    if (!await forecastList.isVisible()) {
      return 0;
    }
    const items = forecastList.getByRole('listitem');
    return items.count();
  }).toBe(24);
});
