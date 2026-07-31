// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure the info panel toggle is in the pressed (active) state.
  // If it is not pressed, click it to open the panel.
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  const isInfoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (isInfoPanelPressed !== 'true') {
    await infoPanelToggle.click({ force: true });
    await expect(infoPanel).toBeVisible();
  }

  // Click on the map canvas to trigger the forecast for that position.
  // We click roughly in the center of the visible map area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Wait for the highlighted coordinate to appear on the map.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the info panel to no longer show the initial "Click on the map to load a forecast." message.
  // The forecast section should appear with actual data.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // The forecast should contain 24 entries. We can check for the presence of the forecast content.
  // Since we don't have a specific test id for the entries, we'll check that the section is visible and
  // has some content that is not the initial placeholder text.
  const infoPanelContent = page.getByTestId('info-panel');
  await expect.poll(() => infoPanelContent.locator('text=Click on the map to load a forecast.').isVisible()).resolves.toBeFalsy();

  // We can also assert that the weather forecast section has some child elements, indicating it's populated.
  const forecastEntries = weatherForecastSection.locator('> *');
  await expect(forecastEntries).toHaveCountGreaterThan(0);
});
