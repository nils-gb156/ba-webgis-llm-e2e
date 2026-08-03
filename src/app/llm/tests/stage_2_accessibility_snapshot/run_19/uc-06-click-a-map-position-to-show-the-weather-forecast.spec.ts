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
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(mapBox.width * 0.55),
      y: Math.floor(mapBox.height * 0.45)
    }
  });

  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const allElements = [section, ...Array.from(section.querySelectorAll('*'))];

      for (const element of allElements) {
        if (element.children.length === 24) {
          return 24;
        }
      }

      const listItemCount = section.querySelectorAll('li, [role="listitem"]').length;
      if (listItemCount === 24) {
        return 24;
      }

      const tableRowCount = section.querySelectorAll('tbody > tr').length;
      if (tableRowCount === 24) {
        return 24;
      }

      const timeMatches = (section.textContent ?? '').match(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/g) ?? [];
      return timeMatches.length;
    });
  }).toBe(24);
});
