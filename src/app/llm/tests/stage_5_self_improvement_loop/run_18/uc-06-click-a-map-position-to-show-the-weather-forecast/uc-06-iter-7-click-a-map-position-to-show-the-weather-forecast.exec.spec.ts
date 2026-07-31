// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default in the initial state)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast loading.
  // The map canvas is rendered by OpenLayers, so we click directly on the container.
  // Use a position that is clearly within the map area, away from the side panel.
  await page.getByTestId('map-container').click({ position: { x: 600, y: 300 } });

  // Wait for the weather forecast section to become visible in the info panel
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Verify that the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify that the forecast contains 24 entries.
  // The forecast entries are rendered as elements with data-testid="weather-forecast-entry"
  // inside the weather-forecast-section.
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    await expect(section).toBeVisible();
    return section.getByTestId('weather-forecast-entry').count();
  }).toBe(24);
});
