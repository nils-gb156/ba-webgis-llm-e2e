// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click the center of the map canvas to trigger a forecast request.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 400, y: 300 } });

  // Wait for the forecast data to appear in the info panel.
  // The use case specifies 24 entries; we poll for the section to contain at least 24 list items.
  const weatherSection = page.getByTestId('weather-forecast-section');
  await expect.poll(() => weatherSection.locator('li').count()).toBeGreaterThanOrEqual(24);

  // Verify the clicked position is highlighted on the map.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
});
