// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapZoomLevel
} from '../../../../map-model-helpers';

test('UC6 Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }

  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Weather Forecast');
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.62),
      y: Math.round(box.height * 0.5)
    }
  });

  await expect
    .poll(async () => {
      const coordinate = await getHighlightedCoordinate(page);
      return Array.isArray(coordinate) && coordinate.length === 2;
    })
    .toBe(true);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect
    .poll(async () => {
      return await weatherForecastSection.evaluate((section) => {
        const counts = new Set<number>();

        const text = section.textContent ?? '';
        counts.add((text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length);
        counts.add(section.querySelectorAll('li, [role="listitem"]').length);
        counts.add(section.querySelectorAll('tbody tr').length);

        const containers = [section, ...Array.from(section.querySelectorAll('*'))];
        for (const container of containers) {
          const visibleDirectChildren = Array.from(container.children).filter((child) => {
            const rect = child.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && (child.textContent ?? '').trim().length > 0;
          }).length;
          counts.add(visibleDirectChildren);
        }

        return counts.has(24);
      });
    })
    .toBe(true);
});
