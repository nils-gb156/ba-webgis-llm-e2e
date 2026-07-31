// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible. The accessibility tree shows it is already pressed/visible,
  // but we ensure it by verifying visibility rather than toggling, as it might already be open.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the forecast load.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 200, y: 200 } });

  // Wait for the weather forecast section to appear in the info panel.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the clicked position is highlighted on the map.
  // Since map state is not in DOM, we rely on the visual update or check if the coordinate viewer updated.
  // The coordinate viewer should show the clicked coordinates.
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  await expect(coordinateViewer).toBeVisible();
  // The coordinate viewer text should not be empty or the initial value.
  // We just assert it's visible and contains some coordinate data.
  await expect(coordinateViewer).toHaveText(/-?\d+(\.\d+)?, *-?\d+(\.\d+)?/);

  // Verify the forecast contains 24 entries.
  // The forecast entries are likely list items or similar within the weather-forecast-section.
  // We'll count the number of child elements that look like forecast entries.
  // Assuming each entry is a distinct DOM element (e.g., div, li) inside the section.
  const forecastEntries = weatherForecastSection.locator('> *');
  await expect(forecastEntries).toHaveCount(24);
});
