// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapZoomLevel
} from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(-1);

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();

  await mapContainer.click({ position: { x: 700, y: 400 } });

  await expect.poll(async () => {
    const highlightedCoordinate = await getHighlightedCoordinate(page);
    return highlightedCoordinate?.length ?? 0;
  }).toBe(2);

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const table = section.querySelector('table');
      if (table) {
        const bodyRows = table.querySelectorAll('tbody tr');
        if (bodyRows.length > 0) {
          return bodyRows.length;
        }

        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length > 0) {
          const headerRows = table.querySelectorAll('thead tr').length;
          if (headerRows > 0) {
            return rows.length - headerRows;
          }

          const firstRowHasHeaderCells = (rows[0]?.querySelectorAll('th').length ?? 0) > 0;
          return firstRowHasHeaderCells ? rows.length - 1 : rows.length;
        }
      }

      const list = section.querySelector('[role="list"], ul, ol');
      if (list) {
        const directRoleItems = list.querySelectorAll(':scope > [role="listitem"]');
        if (directRoleItems.length > 0) {
          return directRoleItems.length;
        }

        const directLiItems = list.querySelectorAll(':scope > li');
        if (directLiItems.length > 0) {
          return directLiItems.length;
        }
      }

      const allListItems = section.querySelectorAll('[role="listitem"], li');
      if (allListItems.length > 0) {
        return allListItems.length;
      }

      const articles = section.querySelectorAll('article');
      if (articles.length > 0) {
        return articles.length;
      }

      const text = section.innerText;
      const hour24Matches = text.match(/\b(?:[01]\d|2[0-3]):00\b/g);
      if (hour24Matches && hour24Matches.length > 0) {
        return hour24Matches.length;
      }

      const amPmMatches = text.match(/\b(?:0?\d|1\d|2[0-3])\s?(?:AM|PM)\b/gi);
      return amPmMatches?.length ?? 0;
    });
  }).toBe(24);
});
