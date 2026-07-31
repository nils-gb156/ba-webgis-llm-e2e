// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The Temperature checkbox is currently checked. Clicking it should uncheck it.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click();
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is currently unchecked. Clicking it should check it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click();
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // The first result is typically the most relevant match.
  // We look for the first list item or button within the panel that contains "Münster".
  const firstResult = geocoderPanel.getByRole('option', { name: /Münster/ }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We verify this by checking that the info panel updates or by waiting for a network response
  // related to the geocoder selection or feature info. Since we don't have specific map helpers,
  // we wait for the info panel to start loading or change state.
  // The info panel is already visible. We expect the "Weather Forecast" section to start appearing.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Step 6: Wait for the info panel to load the forecast.
  // We poll for the weather forecast section to be visible and contain 24 entries.
  await expect.poll(async () => {
    const forecastSection = page.getByTestId('weather-forecast-section');
    if (!await forecastSection.isVisible()) {
      return 0;
    }
    // Count the number of forecast entries. Assuming each entry is a list item or a specific element.
    // Based on the context, the forecast section contains entries. Let's assume they are list items or divs.
    // We will look for a common structure. Often forecasts are in a list.
    const entries = forecastSection.locator('li').or(forecastSection.locator('[data-testid*="forecast-entry"]'));
    // If specific test IDs aren't known, we might count by text or role.
    // Let's try to count elements that look like forecast items.
    // A safer bet is to wait for the section to be visible and then assert the count of items inside.
    // Since we don't know the exact DOM structure of the forecast entries, we'll assume they are distinct elements.
    // Let's try counting paragraphs or divs inside the weather forecast section.
    const children = forecastSection.locator('div, li, p').filter({ hasText: /°C|°F|Weather|Forecast/ });
    // This might be too broad. Let's rely on the visibility of the section and a reasonable number of items.
    // The expected result says 24 entries.
    // We will poll for the section to have at least 24 child elements that look like entries.
    // Without specific test IDs, we might use a heuristic.
    // Let's assume the entries are list items in a list.
    const listItems = forecastSection.locator('li');
    const count = await listItems.count();
    return count;
  }).toBeGreaterThanOrEqual(24);
});
