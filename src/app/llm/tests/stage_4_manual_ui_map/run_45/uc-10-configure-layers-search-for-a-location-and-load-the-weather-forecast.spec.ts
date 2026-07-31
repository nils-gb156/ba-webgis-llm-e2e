// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // 1. Hide the Temperature overlay layer
  // The layer switcher is visible by default. We click the checkbox for "Temperature".
  // Since it's a Chakra checkbox, we use force: true to bypass the decorative overlay.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation overlay layer
  // It is initially hidden, so we click its checkbox to show it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for results to appear and select the first one
  // The results list appears after typing and Nominatim returns results.
  // We wait for the first result item to be visible.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // We poll the map center to ensure it has changed from the initial default position.
  // We also check that the zoom level has changed, indicating navigation.
  const initialCenter = await getMapCenter(page);
  const initialZoom = await getMapZoomLevel(page);

  await expect.poll(async () => {
    const currentCenter = await getMapCenter(page);
    const currentZoom = await getMapZoomLevel(page);
    return {
      center: currentCenter,
      zoom: currentZoom,
      changed: (currentCenter !== initialCenter && currentCenter !== undefined) || (currentZoom !== initialZoom && currentZoom !== undefined)
    };
  }).toMatchObject({ changed: true });

  // 6. Wait for the info panel to load the forecast
  // The weather forecast section appears after clicking on the map and the forecast loads.
  // In this flow, selecting a geocoder result likely triggers a map click or similar event
  // that initiates the forecast load. We wait for the forecast entries to appear.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  
  // We expect 24 entries as per the use case description.
  // We use expect.poll to wait for the count to settle.
  await expect.poll(async () => {
    return await forecastEntries.count();
  }).toBe(24);
});
