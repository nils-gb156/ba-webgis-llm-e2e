// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  let map = page.getByTestId('map');
  if ((await map.count()) === 0) {
    map = page.locator('canvas').first();
  }

  await expect(map).toBeVisible();

  const infoPanel = page.getByTestId('info-panel');
  if ((await infoPanel.count()) > 0) {
    await expect(infoPanel).toBeVisible();
  }

  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();

  await map.click({
    position: {
      x: Math.round((mapBox!.width * 0.5)),
      y: Math.round((mapBox!.height * 0.5))
    }
  });

  let forecastSection = page.getByTestId('weather-forecast');
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByRole('region', { name: /weather forecast/i });
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByRole('group', { name: /weather forecast/i });
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByRole('heading', { name: /weather forecast/i });
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByText(/weather forecast/i);
  }

  await expect(forecastSection).toBeVisible();

  const possibleHighlight = page.getByTestId('selected-location');
  if ((await possibleHighlight.count()) > 0) {
    await expect(possibleHighlight).toBeVisible();
  }

  await expect.poll(async () => {
    const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
    const weatherForecastEntriesCount = await weatherForecastEntries.count();
    if (weatherForecastEntriesCount > 0) {
      return weatherForecastEntriesCount;
    }

    const forecastEntries = page.getByTestId('forecast-entry');
    const forecastEntriesCount = await forecastEntries.count();
    if (forecastEntriesCount > 0) {
      return forecastEntriesCount;
    }

    const listItemCount = await forecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await forecastSection.getByRole('row').count();
    if (rowCount > 1) {
      return rowCount - 1;
    }

    return 0;
  }).toBe(24);
});
