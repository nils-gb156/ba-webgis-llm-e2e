// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const forecastInstruction = weatherForecastSection.getByText('Click on the map to load a forecast.');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    const pressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(forecastInstruction).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round((mapBox!.width * 0.5)),
      y: Math.round((mapBox!.height * 0.5))
    }
  });

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((node) => {
      const root = node as HTMLElement;

      const countVisible = (selector: string) =>
        Array.from(root.querySelectorAll(selector)).filter((element) => {
          const htmlElement = element as HTMLElement;
          return htmlElement.offsetParent !== null;
        }).length;

      const candidateCounts = [
        countVisible('[role="listitem"]'),
        countVisible('li'),
        countVisible('time'),
        countVisible('article'),
        countVisible('tbody tr'),
        countVisible('tr')
      ];

      if (candidateCounts.includes(24)) {
        return 24;
      }

      return Math.max(0, ...candidateCounts);
    });
  }).toBe(24);

  await expect(weatherForecastSection).toBeVisible();
});
