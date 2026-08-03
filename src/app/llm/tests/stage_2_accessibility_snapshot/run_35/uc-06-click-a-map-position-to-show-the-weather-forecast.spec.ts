// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    const pressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.floor(mapBox!.width * 0.55),
      y: Math.floor(mapBox!.height * 0.5)
    }
  });

  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
  await expect(weatherForecastSection).toBeVisible();

  const countForecastEntries = async (): Promise<number> => {
    const rowCount = await weatherForecastSection.getByRole('row').count();
    const columnHeaderCount = await weatherForecastSection.getByRole('columnheader').count();
    if (rowCount > 0) {
      return columnHeaderCount > 0 ? rowCount - 1 : rowCount;
    }

    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const articleCount = await weatherForecastSection.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    return 0;
  };

  await expect.poll(countForecastEntries).toBe(24);
});
