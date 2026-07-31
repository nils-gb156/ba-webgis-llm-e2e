// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial load and layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for result list and select first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result (assuming it's a list item or button within the panel)
  // Since specific test ids for results aren't provided, we use getByText within the panel
  const firstResult = geocoderPanel.getByRole('option', { name: 'Münster', exact: true }).first();
  // Fallback if 'option' role isn't used, try button or link
  const resultLocator = firstResult.count() > 0 ? firstResult : geocoderPanel.getByRole('button', { name: /Münster/ }).first();
  
  await resultLocator.click();

  // Step 5: Wait for map to navigate (we can't assert map position directly via DOM, 
  // but we can wait for the info panel to start loading or for the geocoder panel to close)
  await expect(geocoderPanel).not.toBeVisible();

  // Step 6: Wait for info panel to load the forecast with 24 entries
  // The info panel contains a "Weather Forecast" section.
  // We poll for the presence of 24 forecast entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Poll for the forecast data to load. Assuming each entry has a consistent structure,
  // we can count elements within the weather forecast section.
  // Without specific test IDs for forecast entries, we look for a common pattern.
  // Often forecast entries might be list items or divs.
  // Let's assume they are list items or have a specific role if available.
  // If not, we might count distinct time slots or temperature readings.
  // A robust way is to wait for the section to contain a significant amount of content.
  // However, the requirement is specifically "24 entries".
  
  // Let's try to count elements that look like forecast cards/items.
  // If the structure is <ul> with <li>, we can count li.
  // If it's a grid of divs, we might need to be more generic.
  // Given the accessibility tree mentions "Weather Forecast" heading and paragraph,
  // the actual data might be rendered dynamically.
  
  // We will poll for the weather forecast section to have a certain number of child elements
  // that represent data points. A safe bet is to look for elements with a date/time or temp.
  // Since we don't have exact selectors, we'll poll for the visibility of the section
  // and then assert on a specific number of forecast items if we can identify them.
  
  // Let's assume the forecast items are list items within the weather-forecast-section
  // or have a common class. Without test IDs, this is tricky.
  // Let's try to find elements that might represent a day/hour.
  
  // Alternative: Poll for the text "24" or similar if it indicates the count,
  // or just wait for the section to be populated with enough content.
  
  // Let's try to count elements that are likely forecast entries.
  // If the app renders a list of 24 hours/days, they might be divs or li.
  // We'll poll for at least one element to appear, then check the count.
  
  await expect.poll(async () => {
    const items = page.locator('[data-testid="weather-forecast-section"] > *');
    // Filter out non-entry elements like headings if necessary, 
    // but usually the entries are the main children.
    // Let's assume the entries are direct children or have a specific role.
    // If no specific role, we might count all visible children.
    // A better heuristic: count elements that have text content resembling a forecast.
    return items.count();
  }).toBeGreaterThan(0);

  // Now, let's try to verify the count of 24.
  // If the entries are list items:
  const forecastEntries = page.locator('[data-testid="weather-forecast-section"] li');
  await expect.poll(() => forecastEntries.count()).toBe(24);

  // Verify final layer states
  // Temperature should be unchecked (hidden)
  await expect(temperatureToggle).not.toBeChecked();
  // Precipitation should be checked (visible)
  await expect(precipitationToggle).toBeChecked();
});
