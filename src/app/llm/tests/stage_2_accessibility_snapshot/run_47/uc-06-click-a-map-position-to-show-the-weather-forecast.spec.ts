// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const emptyStateText = weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true });
  const mapContainer = page.getByTestId('map-container');

  await expect(infoPanelToggle).toBeVisible();

  if (await infoPanel.isVisible()) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  } else {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(
    weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
  ).toBeVisible();
  await expect(emptyStateText).toBeVisible();

  await expect(mapContainer).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.5),
      y: Math.round(mapBox.height * 0.45),
    },
  });

  await expect(emptyStateText).toBeHidden();
  await expect(weatherForecastSection).toBeVisible();

  await expect
    .poll(async () => {
      const listItemCount = await weatherForecastSection.getByRole('listitem').count();
      if (listItemCount > 0) {
        return listItemCount;
      }

      const rowCount = await weatherForecastSection.getByRole('row').count();
      if (rowCount > 1) {
        return rowCount - 1;
      }

      const articleCount = await weatherForecastSection.getByRole('article').count();
      if (articleCount > 0) {
        return articleCount;
      }

      const buttonCount = await weatherForecastSection.getByRole('button').count();
      if (buttonCount > 0) {
        return buttonCount;
      }

      return 0;
    })
    .toBe(24);
});
