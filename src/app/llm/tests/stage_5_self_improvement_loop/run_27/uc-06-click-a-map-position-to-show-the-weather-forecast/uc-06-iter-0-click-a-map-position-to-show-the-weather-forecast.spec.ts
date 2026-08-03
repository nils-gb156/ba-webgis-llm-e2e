// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getMapCenter,
  getHighlightedCoordinate
} from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(async () => {
    const center = await getMapCenter(page);
    return Array.isArray(center) && center.length === 2;
  }).toBe(true);

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();

  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(page.getByText('Click on the map to load a forecast.', { exact: true })).toBeVisible();

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  await mapContainer.click({
    position: {
      x: Math.round(mapBox!.width * 0.62),
      y: Math.round(mapBox!.height * 0.42)
    }
  });

  await expect.poll(async () => {
    const coordinate = await getHighlightedCoordinate(page);
    return Array.isArray(coordinate) && coordinate.length === 2;
  }).toBe(true);

  await expect.poll(async () => {
    return await forecastSection.evaluate((section) => {
      const tableBodyRows = section.querySelectorAll('tbody tr').length;
      const roleRows = Array.from(section.querySelectorAll('[role="row"]')).filter((row) => {
        return !row.querySelector('[role="columnheader"], th');
      }).length;
      const listItems = section.querySelectorAll('[role="listitem"], li').length;
      const articles = section.querySelectorAll('article').length;
      const images = section.querySelectorAll('img').length;

      const candidates = [tableBodyRows, roleRows, listItems, articles, images].filter(
        (count) => count > 0
      );

      if (candidates.includes(24)) {
        return 24;
      }

      return candidates.length > 0 ? Math.max(...candidates) : 0;
    });
  }).toBe(24);
});
