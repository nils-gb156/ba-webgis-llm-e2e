// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();

  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanelToggle).toBeVisible();

  const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
  if (infoPanelPressed !== 'true') {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();

  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();
  await expect(
    forecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
  ).toBeVisible();
  await expect(forecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();

  const forecastEntries = forecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(0);

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.5),
      y: Math.round(box.height * 0.45)
    }
  });

  await expect(forecastSection.getByText('Click on the map to load a forecast.')).toBeHidden();
  await expect(forecastSection).toBeVisible();
  await expect(forecastEntries).toHaveCount(24);
});
