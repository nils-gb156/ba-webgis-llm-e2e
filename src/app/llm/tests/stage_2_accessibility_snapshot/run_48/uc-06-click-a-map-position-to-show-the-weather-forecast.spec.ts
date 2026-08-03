// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const forecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    const isPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(forecastSection).toBeVisible();
  await expect(forecastSection).toContainText('Click on the map to load a forecast.');

  const beforeMapScreenshot = await mapContainer.screenshot();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const clickPosition = {
    x: Math.min(Math.floor((mapBox?.width ?? 0) * 0.5), Math.floor((mapBox?.width ?? 0) - 20)),
    y: Math.min(Math.floor((mapBox?.height ?? 0) * 0.5), Math.floor((mapBox?.height ?? 0) - 20))
  };

  await mapContainer.click({ position: clickPosition });

  await expect(forecastSection).not.toContainText('Click on the map to load a forecast.');

  const getForecastEntryCount = async () =>
    await forecastSection.evaluate((section) => {
      const text = section.textContent ?? '';
      if (text.includes('Click on the map to load a forecast.')) {
        return 0;
      }

      const roleListItems = section.querySelectorAll('[role="listitem"]').length;
      if (roleListItems === 24) {
        return 24;
      }

      const listItems = section.querySelectorAll('li').length;
      if (listItems === 24) {
        return 24;
      }

      const articles = section.querySelectorAll('article').length;
      if (articles === 24) {
        return 24;
      }

      const rows = section.querySelectorAll('[role="row"]').length;
      const headers = section.querySelectorAll('[role="rowheader"], [role="columnheader"]').length;
      if (rows - headers === 24) {
        return 24;
      }

      const elements = [section, ...Array.from(section.querySelectorAll('*'))];
      for (const element of elements) {
        const children = Array.from(element.children).filter((child) => {
          const childText = (child.textContent ?? '').trim();
          return childText.length > 0 || child.querySelector('img, svg, canvas') !== null;
        });

        if (children.length === 24) {
          return 24;
        }
      }

      return 0;
    });

  await expect.poll(getForecastEntryCount).toBe(24);

  const afterMapScreenshot = await mapContainer.screenshot();
  expect(afterMapScreenshot.equals(beforeMapScreenshot)).toBeFalsy();
});
