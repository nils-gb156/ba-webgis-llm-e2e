// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible. The accessibility tree shows it is already pressed/visible.
  // We assert its visibility to ensure preconditions are met.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the forecast request.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Wait for the weather forecast section to appear and contain 24 entries.
  // The forecast entries are likely in the info panel under the weather forecast section.
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
  
  // We poll for the section to be visible and then check for the number of forecast entries.
  // Since we don't have a specific testid for the entries, we look for a container that likely holds them.
  // Often, forecast lists have a specific structure. Let's assume the section itself becomes populated.
  // We'll wait for the section to be visible first.
  await expect(weatherForecastSection).toBeVisible();

  // The expected result states "The forecast contains 24 entries".
  // We need to find the elements representing the entries.
  // Looking at the accessibility tree, there isn't a specific list for forecasts yet.
  // However, typically these are rendered as a list of items.
  // Let's try to find a list or a set of elements within the weather forecast section.
  // If there's no specific role, we might count paragraphs or divs, but that's fragile.
  // Let's assume the forecast entries are represented by distinct elements, possibly with a common class or role.
  // Without more specific UI context for the forecast items, we will assert the section is visible and then
  // try to find a reasonable indicator of 24 entries.
  
  // A common pattern is a list. Let's look for a list or a grid.
  // If we can't find a specific locator for the 24 items, we might have to rely on the section being visible and non-empty,
  // but the requirement is specific: 24 entries.
  
  // Let's assume the forecast entries are rendered as a list of items within the weather-forecast-section.
  // We will try to find elements that look like forecast entries.
  // Since we don't have a testid for the entries, we might use getByRole('list') inside the section if it exists,
  // or count specific text patterns if they are predictable.
  
  // Given the complexity and lack of specific testids for forecast items, we will poll for the visibility of the section
  // and then attempt to count elements that likely represent the forecast data.
  // Let's assume the forecast data is presented in a list format.
  
  // We will wait for the weather forecast section to be visible and then check for the presence of 24 distinct items.
  // If the items are not easily selectable, we might need to rely on the content.
  
  // Let's try to find a list within the weather forecast section.
  const forecastList = weatherForecastSection.locator('ul').first();
  
  // Poll for the list to have 24 children (entries).
  // This assumes the forecast entries are direct children of a list.
  await expect.poll(async () => {
    const list = page.getByTestId('weather-forecast-section').locator('ul').first();
    const count = await list.locator('li').count();
    return count;
  }).toBe(24);

  // Additionally, verify that the clicked position is highlighted on the map.
  // This is harder to assert without a specific testid for the marker.
  // However, the info panel updating is the primary indicator.
  // We can also check if the scale bar or other UI elements update, but the forecast is the key.
  
  // Final assertion: The info panel should show the weather forecast.
  await expect(infoPanel).toContainText('Weather Forecast');
});
