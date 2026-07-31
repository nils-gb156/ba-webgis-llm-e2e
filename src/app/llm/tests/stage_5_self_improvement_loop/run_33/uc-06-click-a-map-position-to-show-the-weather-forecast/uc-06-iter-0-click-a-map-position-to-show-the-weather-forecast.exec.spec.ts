// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: info panel visible, map canvas interactive
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click on a position on the map canvas
  await page.getByTestId('map-container').click({ position: { x: 400, y: 300 } });

  // Step 2: Wait for the info panel to load the forecast
  // Expected: The clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Expected: The info panel displays a weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Expected: The forecast contains 24 entries
  const entries = page.getByTestId('weather-forecast-section').locator('[data-testid="forecast-entry"]');
  await expect(entries).toHaveCount(24);
});
