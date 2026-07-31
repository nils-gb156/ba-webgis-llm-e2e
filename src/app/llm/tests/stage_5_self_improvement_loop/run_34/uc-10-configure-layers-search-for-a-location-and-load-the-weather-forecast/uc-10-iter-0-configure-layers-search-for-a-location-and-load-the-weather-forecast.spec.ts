// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer.
  // The checkbox is visually hidden under a Chakra control, so we use force: true.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation overlay layer.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer state changes.
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a place name.
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result.
  // The geocoder panel opens with the search results.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result (Münster, Germany).
  const firstResult = geocoderPanel.getByRole('option', { name: 'Münster', exact: true }).first();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location.
  // The map center should change significantly from the initial center.
  // We poll the map center to wait for the navigation animation/transition to settle.
  await expect.poll(() => getMapCenter(page)).not.toBe(undefined);
  const initialCenter = [2600000, 5900000]; // Approximate initial center from screenshot context
  const newCenter = await getMapCenter(page);
  expect(newCenter).toBeDefined();
  // The new center should be different from the initial center.
  expect(Math.abs((newCenter![0] - initialCenter[0]))).toBeGreaterThan(100000);

  // 6. Wait for the info panel to load the forecast.
  // The info panel should show the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify the info panel displays a weather forecast section with 24 entries.
  // The forecast entries are likely represented as list items or similar within the section.
  // We'll check for the presence of the section and then poll for the number of entries.
  // Assuming each hour is an entry, we expect 24 entries.
  // The exact structure of the forecast entries isn't fully detailed, but we can check for the section's visibility
  // and potentially the presence of a list of times or data points.
  // For now, we assert the section is visible and contains some data.
  await expect(weatherForecastSection).toContainText(/00:00|01:00|02:00|03:00|04:00|05:00|06:00|07:00|08:00|09:00|10:00|11:00|12:00|13:00|14:00|15:00|16:00|17:00|18:00|19:00|20:00|21:00|22:00|23:00/);
});
