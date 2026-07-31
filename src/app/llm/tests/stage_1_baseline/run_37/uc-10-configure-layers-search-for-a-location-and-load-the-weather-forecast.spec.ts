// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // 2. Show the Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // 3. Search for a location
  const searchField = page.getByLabel('Search');
  await searchField.fill('Münster');

  // 4. Wait for results and select the first one
  const firstResult = page.getByRole('option', { name: 'Münster', exact: true }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for map navigation (poll map center if helpers provided, otherwise rely on info panel)
  // Assuming no map helpers provided, we wait for the info panel to reflect the new location/forecast
  await expect(page.getByRole('heading', { name: 'Münster' })).toBeVisible();

  // 6. Verify info panel displays weather forecast with 24 entries
  const forecastList = page.getByTestId('weather-forecast-list');
  await expect(forecastList).toBeVisible();
  
  // Poll for the forecast entries to appear and count them
  const entryCount = await expect.poll(async () => {
    const items = page.getByRole('listitem', { name: /forecast/ }); // Adjust selector based on actual implementation
    return items.count();
  }).toBe(24);
});
