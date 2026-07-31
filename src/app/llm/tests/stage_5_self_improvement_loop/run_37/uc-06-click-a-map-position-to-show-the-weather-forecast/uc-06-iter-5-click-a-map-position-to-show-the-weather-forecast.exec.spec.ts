// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and the temperature layer is rendered
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Click a position on the map canvas
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 400, y: 300 } });

  // Wait for the info panel to load the forecast
  const forecastHeading = page.getByRole('heading', { name: 'Weather Forecast' });
  await expect(forecastHeading).toBeVisible();

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify the forecast contains 24 entries
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();
  const forecastEntries = forecastSection.getByRole('row');
  await expect(forecastEntries).toHaveCount(24);
});
