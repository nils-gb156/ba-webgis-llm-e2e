// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is visible by default, but let's be safe)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas. We click near the center to ensure we hit the map.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Wait for the highlight to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to become visible
  await expect(page.getByTestId('weather-forecast')).toBeVisible();

  // Wait for the forecast entries to load. The use case expects 24 entries.
  // We poll for the count of weather-forecast-entry elements.
  await expect.poll(async () => {
    const entries = page.getByTestId('weather-forecast-entry');
    return await entries.count();
  }).toBe(24);
});
