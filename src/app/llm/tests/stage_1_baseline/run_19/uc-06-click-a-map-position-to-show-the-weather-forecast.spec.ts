// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoPanel = page.getByRole('complementary').or(page.locator('aside')).first();
  await expect(infoPanel).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('The map canvas is not interactive because its bounding box is unavailable.');
  }

  let forecastRequestUrl: string | undefined;
  page.on('request', request => {
    const url = request.url();
    if (/forecast/i.test(url)) {
      forecastRequestUrl = url;
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => {
    return /forecast/i.test(response.url()) && response.ok();
  });

  await mapCanvas.click({
    position: {
      x: Math.floor(mapBox.width * 0.6),
      y: Math.floor(mapBox.height * 0.4)
    }
  });

  await forecastResponsePromise;

  await expect.poll(() => forecastRequestUrl).toMatch(/forecast/i);

  const forecastUrl = new URL(forecastRequestUrl!);
  const latitude = forecastUrl.searchParams.get('latitude') ?? forecastUrl.searchParams.get('lat');
  const longitude = forecastUrl.searchParams.get('longitude') ?? forecastUrl.searchParams.get('lon');
  expect(latitude).toBeTruthy();
  expect(longitude).toBeTruthy();

  const weatherForecastSection = page
    .getByRole('heading', { name: /weather forecast/i })
    .or(page.getByText(/weather forecast/i))
    .first();

  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate(node => {
      let container: Element | null = node instanceof Element ? node : node.parentElement;

      while (container) {
        const listItems = container.querySelectorAll('li,[role="listitem"]');
        if (listItems.length === 24) {
          return 24;
        }

        const rows = Array.from(container.querySelectorAll('tbody tr,[role="row"]')).filter(row =>
          /\b\d{1,2}:\d{2}\b/.test(row.textContent ?? '')
        );
        if (rows.length === 24) {
          return 24;
        }

        const uniqueTimes = new Set<string>();
        for (const element of Array.from(container.querySelectorAll('*'))) {
          const matches = (element.textContent ?? '').match(/\b\d{1,2}:\d{2}\b/g);
          if (matches) {
            for (const match of matches) {
              uniqueTimes.add(match);
            }
          }
        }
        if (uniqueTimes.size === 24) {
          return 24;
        }

        container = container.parentElement;
      }

      return 0;
    });
  }).toBe(24);
});
