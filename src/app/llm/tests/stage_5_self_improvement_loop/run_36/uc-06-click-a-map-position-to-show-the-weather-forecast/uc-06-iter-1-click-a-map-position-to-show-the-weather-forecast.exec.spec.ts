// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(weatherForecastSection).toBeVisible();
  await expect(
    weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
  ).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
  await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.45),
      y: Math.round(mapBox.height * 0.4),
    },
  });

  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();
  await expect(weatherForecast).toContainText('Location:');

  await expect.poll(async () => {
    return await weatherForecast.getByTestId('weather-forecast-entry').count();
  }).toBe(24);
});
