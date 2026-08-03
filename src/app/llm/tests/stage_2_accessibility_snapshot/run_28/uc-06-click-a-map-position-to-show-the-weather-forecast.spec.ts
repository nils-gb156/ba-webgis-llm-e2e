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
    const isPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  const initialPrompt = infoPanel.getByText('Click on the map to load a forecast.', { exact: true });
  await expect(initialPrompt).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round(mapBox!.width * 0.5),
      y: Math.round(mapBox!.height * 0.5)
    }
  });

  await expect(initialPrompt).not.toBeVisible();

  const getForecastEntryCount = async (): Promise<number> => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount === 24) {
      return 24;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount === 24 || rowCount === 25) {
      return 24;
    }

    const imageCount = await weatherForecastSection.getByRole('img').count();
    if (imageCount === 24) {
      return 24;
    }

    const sectionText = (await weatherForecastSection.textContent()) ?? '';
    const uniqueTimes = [...new Set(sectionText.match(/\b\d{1,2}:\d{2}\b/g) ?? [])];
    if (uniqueTimes.length === 24) {
      return 24;
    }

    return listItemCount || rowCount || imageCount || uniqueTimes.length;
  };

  await expect.poll(getForecastEntryCount).toBe(24);
});
