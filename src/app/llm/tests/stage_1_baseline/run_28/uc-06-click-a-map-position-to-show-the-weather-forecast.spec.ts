// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  let infoPanelScope = page.locator('body');
  const complementaryPanels = page.getByRole('complementary');
  if ((await complementaryPanels.count()) > 0) {
    infoPanelScope = complementaryPanels.first();
    await expect(infoPanelScope).toBeVisible();
  } else {
    const regionPanels = page
      .getByRole('region')
      .filter({ hasText: /info|information|details|forecast|weather|wetter/i });
    if ((await regionPanels.count()) > 0) {
      infoPanelScope = regionPanels.first();
      await expect(infoPanelScope).toBeVisible();
    }
  }

  let forecastRequestUrl: string | undefined;
  page.on('request', request => {
    const url = request.url();
    if (/forecast|weather|open-meteo/i.test(url)) {
      forecastRequestUrl = url;
    }
  });

  const forecastResponsePromise = page
    .waitForResponse(
      response => /forecast|weather|open-meteo/i.test(response.url()) && response.ok(),
      { timeout: 15000 }
    )
    .catch(() => null);

  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();

  const clickPosition = mapBox
    ? {
        x: Math.max(1, Math.min(Math.floor(mapBox.width / 2), Math.floor(mapBox.width - 1))),
        y: Math.max(1, Math.min(Math.floor(mapBox.height / 2), Math.floor(mapBox.height - 1)))
      }
    : { x: 50, y: 50 };

  await mapCanvas.click({ position: clickPosition });

  await expect.poll(() => forecastRequestUrl).toMatch(/forecast|weather|open-meteo/i);

  const forecastResponse = await forecastResponsePromise;
  if (forecastResponse) {
    await expect(forecastResponse.ok()).toBe(true);
  }

  let forecastHeading = infoPanelScope.getByRole('heading', {
    name: /weather forecast|forecast|wettervorhersage|wetter/i
  });
  if ((await forecastHeading.count()) === 0) {
    forecastHeading = infoPanelScope.getByText(/weather forecast|forecast|wettervorhersage|wetter/i);
  }
  await expect(forecastHeading.first()).toBeVisible();

  await expect
    .poll(async () => {
      const listItems = await infoPanelScope.getByRole('listitem').count();
      if (listItems === 24) {
        return listItems;
      }

      const tableRows = await infoPanelScope.getByRole('row').count();
      if (tableRows === 25) {
        return tableRows - 1;
      }

      return await infoPanelScope.getByText(/\b\d{1,2}:\d{2}\b/).count();
    })
    .toBe(24);
});
