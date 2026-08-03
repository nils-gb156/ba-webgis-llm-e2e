// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');

  await expect(infoPanelToggle).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();

  const forecastSection = infoPanel.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();
  await expect(forecastSection).toContainText('Click on the map to load a forecast.');

  const map = page.getByTestId('map-container');
  await expect(map).toBeVisible();

  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await map.click({
    position: {
      x: Math.round(mapBox.width * 0.5),
      y: Math.round(mapBox.height * 0.45),
    },
  });

  await expect(forecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    const listItemCount = await forecastSection.getByRole('listitem').count();
    const articleCount = await forecastSection.getByRole('article').count();
    const rowCount = await forecastSection.getByRole('row').count();
    const headingCount = await forecastSection.getByRole('heading').count();
    const imageCount = await forecastSection.getByRole('img').count();
    const timeLabelCount = await forecastSection.getByText(/\b\d{1,2}:\d{2}\b/).count();

    return [
      listItemCount,
      articleCount,
      rowCount,
      Math.max(rowCount - 1, 0),
      headingCount,
      Math.max(headingCount - 1, 0),
      imageCount,
      timeLabelCount,
    ];
  }).toContain(24);
});
