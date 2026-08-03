// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const clickPosition = {
    x: Math.min(Math.floor(mapBox.width) - 10, Math.max(10, Math.floor(mapBox.width * 0.75))),
    y: Math.min(Math.floor(mapBox.height) - 10, Math.max(10, Math.floor(mapBox.height * 0.45)))
  };

  const beforeClickScreenshot = await mapContainer.screenshot();

  await mapContainer.click({ position: clickPosition });

  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    const afterClickScreenshot = await mapContainer.screenshot();
    return afterClickScreenshot.equals(beforeClickScreenshot);
  }).toBe(false);

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    const rowCount = await weatherForecastSection.getByRole('row').count();
    const imageCount = await weatherForecastSection.getByRole('img').count();
    const textContent = (await weatherForecastSection.textContent()) ?? '';
    const hourlyTimeMatches = textContent.match(/\b(?:[01]?\d|2[0-3]):00\b/g) ?? [];

    const candidateCounts = [
      listItemCount,
      rowCount,
      rowCount - 1,
      imageCount,
      hourlyTimeMatches.length
    ];

    return candidateCounts.includes(24) ? 24 : Math.max(...candidateCounts, 0);
  }).toBe(24);
});
