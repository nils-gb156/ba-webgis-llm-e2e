// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const mapContainer = page.getByTestId('map-container');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
  await expect(mapContainer).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(mapBox.width * 0.6),
      y: Math.floor(mapBox.height * 0.4)
    }
  });

  const getForecastEntryCount = async (): Promise<number> => {
    const candidates: number[] = [];

    const pushCandidate = (value: number) => {
      if (value > 0) {
        candidates.push(value);
      }
    };

    pushCandidate(await weatherForecastSection.getByRole('listitem').count());
    pushCandidate(await weatherForecastSection.getByRole('article').count());
    pushCandidate(await weatherForecastSection.getByRole('group').count());
    pushCandidate(await weatherForecastSection.getByRole('img').count());

    const rowCount = await weatherForecastSection.getByRole('row').count();
    const columnHeaderCount = await weatherForecastSection.getByRole('columnheader').count();
    const rowHeaderCount = await weatherForecastSection.getByRole('rowheader').count();

    if (rowCount > 0) {
      pushCandidate(columnHeaderCount > 0 || rowHeaderCount > 0 ? rowCount - 1 : rowCount);
    }
    pushCandidate(columnHeaderCount);

    const sectionText = await weatherForecastSection.innerText();
    const hourMatches = sectionText.match(/\b(?:[01]?\d|2[0-3]):\d{2}\b/g) ?? [];
    pushCandidate(new Set(hourMatches).size);

    return candidates.includes(24) ? 24 : (candidates[0] ?? 0);
  };

  await expect.poll(getForecastEntryCount).toBe(24);
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
});
