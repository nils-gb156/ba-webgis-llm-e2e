// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  let infoPanel = page.getByTestId(/info.*panel/i);
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByRole('complementary').first();
  }
  await expect(infoPanel).toBeVisible();

  let map = page.getByTestId(/^(map|map-container)$/i);
  if ((await map.count()) === 0) {
    map = page.getByTestId(/map/i).first();
  }
  if ((await map.count()) === 0) {
    map = page.locator('canvas').first();
  }
  await expect(map).toBeVisible();

  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map is not interactable.');
  }

  await map.click({
    position: {
      x: Math.round(mapBox.width * 0.5),
      y: Math.round(mapBox.height * 0.5)
    }
  });

  let forecastHeading = infoPanel.getByRole('heading', { name: /weather forecast/i });
  if ((await forecastHeading.count()) === 0) {
    forecastHeading = infoPanel.getByRole('heading', { name: /forecast/i }).first();
  }
  await expect(forecastHeading).toBeVisible();

  let forecastSection = infoPanel.getByTestId(/weather.*forecast|forecast.*weather/i);
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel.getByRole('region', { name: /weather forecast|forecast/i }).first();
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel.locator('section').filter({ has: forecastHeading }).first();
  }
  await expect(forecastSection).toBeVisible();

  let forecastEntries = forecastSection.getByTestId(/forecast.*entry|weather.*entry/i);
  if ((await forecastEntries.count()) === 0) {
    forecastEntries = forecastSection.getByRole('listitem');
  }
  if ((await forecastEntries.count()) === 0) {
    forecastEntries = forecastSection.getByRole('row');
  }
  if ((await forecastEntries.count()) === 0) {
    forecastEntries = forecastSection.locator('article');
  }

  await expect(forecastEntries).toHaveCount(24);
});
