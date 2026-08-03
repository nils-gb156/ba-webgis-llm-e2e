// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  let infoPanel = page.getByTestId('info-panel').first();
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByRole('complementary').first();
  }
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.locator('aside').first();
  }
  await expect(infoPanel).toBeVisible();

  let map = page.getByTestId('map').first();
  if ((await map.count()) === 0) {
    map = page.getByTestId('map-container').first();
  }
  if ((await map.count()) === 0) {
    map = page.getByTestId('map-canvas').first();
  }
  if ((await map.count()) === 0) {
    map = page.locator('canvas').first();
  }
  await expect(map).toBeVisible();

  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();

  await map.click({
    position: {
      x: Math.round(mapBox!.width * 0.5),
      y: Math.round(mapBox!.height * 0.5)
    }
  });

  const forecastTitle = infoPanel.getByText(/weather forecast/i).first();
  await expect(forecastTitle).toBeVisible();

  let forecastSection = page.getByTestId('weather-forecast').first();
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByTestId('forecast').first();
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel.getByRole('region', { name: /weather forecast/i }).first();
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel;
  }

  await expect.poll(async () => {
    const entryTestIds = ['weather-forecast-entry', 'forecast-entry', 'weather-entry'];
    for (const testId of entryTestIds) {
      const count = await forecastSection.getByTestId(testId).count();
      if (count > 0) {
        return count;
      }
    }

    const listItems = await forecastSection.getByRole('listitem').count();
    if (listItems > 0) {
      return listItems;
    }

    const rows = await forecastSection.getByRole('row').count();
    if (rows > 1) {
      return rows - 1;
    }

    const articles = await forecastSection.getByRole('article').count();
    if (articles > 0) {
      return articles;
    }

    return 0;
  }).toBe(24);
});
