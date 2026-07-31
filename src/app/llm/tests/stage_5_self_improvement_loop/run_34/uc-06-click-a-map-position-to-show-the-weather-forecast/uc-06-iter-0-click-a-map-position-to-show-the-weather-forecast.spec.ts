// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and the Temperature layer is rendered.
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Click the map canvas to trigger a forecast request.
  // We click near the center of the visible map area.
  const mapContainer = page.getByTestId('map-container');
  const box = await mapContainer.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  // Wait for the info panel to update with a weather forecast.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the map highlight to appear.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify the forecast contains 24 entries.
  const forecastSection = page.getByTestId('weather-forecast-section');
  const entries = forecastSection.locator('li');
  await expect(entries).toHaveCount(24);
});
