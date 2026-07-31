// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is by default, but we assert it)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the weather forecast for that position.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Wait for the highlighted coordinate to appear on the map.
  // The highlight is rendered on the canvas, not in the DOM, so we use the helper.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Wait for the weather forecast section to become visible in the info panel.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the weather forecast entries to load.
  // We expect 24 entries. We can assert by counting the forecast entry elements.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
