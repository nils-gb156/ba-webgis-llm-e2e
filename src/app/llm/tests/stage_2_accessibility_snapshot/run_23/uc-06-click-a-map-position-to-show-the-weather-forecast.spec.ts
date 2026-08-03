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
  await expect(infoPanelToggle).toBeVisible();

  if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(box.width * 0.5),
      y: Math.floor(box.height * 0.35),
    },
  });

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    const listItems = await weatherForecastSection.getByRole('listitem').count();
    if (listItems === 24) {
      return 24;
    }

    const rows = await weatherForecastSection.getByRole('row').count();
    if (rows === 24) {
      return 24;
    }

    const buttons = await weatherForecastSection.getByRole('button').count();
    if (buttons === 24) {
      return 24;
    }

    return await weatherForecastSection.evaluate((element) => {
      const root = element as HTMLElement;
      const nodes = [root, ...Array.from(root.querySelectorAll('*'))];

      for (const node of nodes) {
        const meaningfulChildren = Array.from(node.children).filter((child) => {
          const childElement = child as HTMLElement;
          const text = childElement.innerText?.trim() ?? '';
          return text.length > 0 || childElement.children.length > 0;
        });

        if (meaningfulChildren.length === 24) {
          return 24;
        }
      }

      return 0;
    });
  }).toBe(24);
});
