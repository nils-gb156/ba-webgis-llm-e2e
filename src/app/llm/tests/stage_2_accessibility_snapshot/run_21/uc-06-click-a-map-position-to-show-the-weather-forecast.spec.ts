// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();

  const infoPanelVisible = await infoPanel.isVisible();
  const infoPanelPressed = (await infoPanelToggle.getAttribute('aria-pressed')) === 'true';
  if (!infoPanelVisible && !infoPanelPressed) {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(forecastPlaceholder).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round((mapBox?.width ?? 0) * 0.5),
      y: Math.round((mapBox?.height ?? 0) * 0.5),
    },
  });

  await expect(forecastPlaceholder).toBeHidden();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    const rowCount = await weatherForecastSection.getByRole('row').count();
    const articleCount = await weatherForecastSection.getByRole('article').count();
    const text = await weatherForecastSection.innerText();
    const timeMatches = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
    const uniqueTimeMatches = [...new Set(timeMatches)];

    return [listItemCount, rowCount, articleCount, uniqueTimeMatches.length];
  }).toContain(24);
});
