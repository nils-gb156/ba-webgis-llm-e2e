// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // Use force: true because Chakra UI renders the real input visually hidden.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer state via the map model (DOM checkbox state may not reflect actual rendering).
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster' using the geocoder.
  await page.getByTestId('geocoder-input').fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  // The geocoder results are rendered as list items with data-testid attributes.
  // The first result is "Münster, North Rhine-Westphalia, Germany".
  await page.getByTestId('geocoder-result-item-0').click();

  // Step 5: Wait for the map to navigate to the selected location.
  // The map center changes after selecting a geocoder result.
  // We poll the map center until it changes from the initial value, indicating navigation.
  const initialCenter = await getMapCenter(page);
  await expect.poll(async () => {
    const currentCenter = await getMapCenter(page);
    return currentCenter !== undefined &&
      (currentCenter[0] !== initialCenter?.[0] || currentCenter[1] !== initialCenter?.[1]);
  }).toBe(true);

  // Step 6: Wait for the info panel to load the forecast.
  // The forecast section should appear with entries.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // Count the forecast entries (typically list items or cards within the section).
  // The entries are rendered as div elements with a class containing "ForecastEntry".
  const forecastEntries = page.getByTestId('weather-forecast-section').locator('[class*="ForecastEntry"]');
  await expect(forecastEntries).toHaveCount(24);
});
