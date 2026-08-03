// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  const previousHighlight = await getHighlightedCoordinate(page);

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.55),
      y: Math.round(box.height * 0.45),
    },
  });

  await expect
    .poll(async () => {
      const highlight = await getHighlightedCoordinate(page);
      if (!highlight) {
        return previousHighlight ? 'missing' : 'missing';
      }
      if (!previousHighlight) {
        return 'defined';
      }
      return highlight[0] === previousHighlight[0] && highlight[1] === previousHighlight[1]
        ? 'unchanged'
        : 'changed';
    })
    .toBe(previousHighlight ? 'changed' : 'defined');

  await expect
    .poll(async () => {
      return await weatherForecastSection.evaluate((section) => {
        const listItemCount = section.querySelectorAll('li, [role="listitem"]').length;
        if (listItemCount === 24) {
          return 24;
        }

        const tableRowCount = section.querySelectorAll('tbody tr').length;
        if (tableRowCount === 24) {
          return 24;
        }

        const articleCount = section.querySelectorAll('article').length;
        if (articleCount === 24) {
          return 24;
        }

        const uniqueTimes = new Set(
          ((section.textContent ?? '').match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [])
        ).size;

        return uniqueTimes;
      });
    })
    .toBe(24);
});
