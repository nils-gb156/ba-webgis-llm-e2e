// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The info panel toggle button is in the "pressed" state (active), so the panel should already be open.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click a position on the map canvas to trigger the weather forecast.
  // We click near the center of the visible map area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Wait for the highlight to appear on the map, indicating the click was registered.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to appear and contain 24 entries.
  // The forecast section should be visible and contain exactly 24 forecast entries.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // The forecast entries are likely rendered as a list or set of items.
  // We'll check that the section contains at least 24 items.
  // Since the exact structure isn't specified, we'll look for a list of items within the forecast section.
  // Assuming the forecast entries are in a list within the weather-forecast-section.
  const forecastEntries = forecastSection.locator('li').or(forecastSection.locator('[role="listitem"]'));
  await expect(forecastEntries).toHaveCount(24);
});
