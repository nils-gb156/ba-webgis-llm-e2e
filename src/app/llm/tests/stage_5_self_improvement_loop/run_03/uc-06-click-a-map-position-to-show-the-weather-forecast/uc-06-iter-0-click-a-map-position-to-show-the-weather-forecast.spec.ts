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
  const weatherSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  if (!(await infoPanel.isVisible())) {
    const isPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherSection).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const countForecastEntries = async (): Promise<number> => {
    const listItemCount = await weatherSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const articleCount = await weatherSection.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    const rowCount = await weatherSection.getByRole('row').count();
    if (rowCount > 0) {
      const headerCount =
        (await weatherSection.getByRole('columnheader').count()) +
        (await weatherSection.getByRole('rowheader').count());
      return headerCount > 0 ? rowCount - 1 : rowCount;
    }

    return await weatherSection.evaluate((section) => {
      const root = section as HTMLElement;

      const exactEntryTestIdCount = root.querySelectorAll('[data-testid="forecast-entry"]').length;
      if (exactEntryTestIdCount > 0) {
        return exactEntryTestIdCount;
      }

      const prefixedEntryTestIdCount = root.querySelectorAll('[data-testid^="forecast-entry"]').length;
      if (prefixedEntryTestIdCount > 0) {
        return prefixedEntryTestIdCount;
      }

      const table = root.querySelector('table');
      if (table) {
        const rows = table.querySelectorAll('tr').length;
        const hasHeader = table.querySelectorAll('th').length > 0;
        return hasHeader ? Math.max(0, rows - 1) : rows;
      }

      const liCount = root.querySelectorAll('li').length;
      if (liCount > 0) {
        return liCount;
      }

      const genericArticleCount = root.querySelectorAll('article').length;
      if (genericArticleCount > 0) {
        return genericArticleCount;
      }

      const hourMatches = root.innerText.match(/\b(?:[01]\d|2[0-3]):00\b/g);
      return hourMatches?.length ?? 0;
    });
  };

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.62),
      y: Math.round(box.height * 0.45)
    }
  });

  await expect.poll(async () => {
    const coordinate = await getHighlightedCoordinate(page);
    return Array.isArray(coordinate) ? coordinate.length : 0;
  }).toBe(2);

  await expect(weatherSection).toBeVisible();
  await expect.poll(countForecastEntries).toBe(24);
});
