// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default in the screenshot)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast
  await page.getByTestId('map-container').click({ position: { x: 500, y: 300 } });

  // Wait for the forecast to load by checking the info panel content
  await expect.poll(() => page.getByTestId('info-panel').getByRole('heading', { name: 'Weather Forecast' }).isVisible()).toBe(true);

  // Check that the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Check that the info panel displays a weather forecast section with 24 entries
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // Verify that the forecast contains 24 entries
  const entries = forecastSection.getByRole('listitem');
  await expect(entries).toHaveCount(24);
});
