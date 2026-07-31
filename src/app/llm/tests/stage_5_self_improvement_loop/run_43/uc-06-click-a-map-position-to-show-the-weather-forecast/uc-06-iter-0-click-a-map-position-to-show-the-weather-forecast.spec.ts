// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Info panel must be visible.
  // The accessibility tree shows the info panel is already open ("Info Panel Switcher" [pressed]).
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // The info panel initially shows "Click on the map to load a forecast."
  // We expect it to change after clicking the map.
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');

  // Step 1: The user clicks on a position on the map canvas.
  // We click near the center of the visible map area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 600, y: 300 } });

  // Step 2: The user waits for the info panel to load the forecast.
  // Expected result: The clicked position is highlighted on the map.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Expected result: The info panel displays a weather forecast section.
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The forecast contains 24 entries.
  // We can't easily count the exact number of entries in the DOM without knowing the internal structure,
  // but we can assert that the section is visible and contains some text.
  // A more robust assertion would be to check for the presence of specific forecast data if available.
  // For now, we assert the section is visible and has content.
  await expect(weatherForecastSection.locator('text=Forecast')).toBeVisible();
  // Assuming the forecast entries are listed, we can check for the first one.
  // Since we don't know the exact structure, we'll just check for the section's visibility and some content.
  // A better approach might be to check for the presence of a specific time slot or temperature if known.
  // For this test, we'll assume that the presence of the section and some text implies 24 entries.
  // To be more precise, let's check for a common element in a 24-entry forecast, like a time slot.
  // We'll check for the first time slot, assuming it's "00:00" or similar.
  // Since we don't know the exact format, we'll just check for the section's visibility.
  // Let's try to find any text that looks like a time slot.
  const forecastEntries = weatherForecastSection.locator('text=/\\d{2}:\\d{2}/');
  await expect(forecastEntries).toHaveCount(24);
});
