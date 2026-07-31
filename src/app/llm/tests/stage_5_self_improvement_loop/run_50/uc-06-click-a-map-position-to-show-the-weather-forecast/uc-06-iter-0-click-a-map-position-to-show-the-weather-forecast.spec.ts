// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify the info panel is visible (precondition)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click a position on the map canvas (center of the visible area)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 500, y: 400 } });

  // Wait for the info panel to load the forecast by polling for the 24 entries
  await expect.poll(() =>
    page.getByTestId('weather-forecast-section').locator('li').count()
  ).toBe(24);

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify the info panel displays a weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
});
