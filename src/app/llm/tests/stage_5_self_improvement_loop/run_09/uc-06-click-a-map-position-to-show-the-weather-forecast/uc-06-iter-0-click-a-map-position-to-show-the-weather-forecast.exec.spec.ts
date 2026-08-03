// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const forecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();
  await expect(forecastSection).toBeVisible();

  const highlightedBeforeClick = await getHighlightedCoordinate(page);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.6),
      y: Math.round(mapBox.height * 0.45),
    },
  });

  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
  if (highlightedBeforeClick !== undefined) {
    await expect.poll(() => getHighlightedCoordinate(page)).not.toEqual(highlightedBeforeClick);
  }

  await expect(forecastSection).toBeVisible();

  await expect.poll(async () => {
    const listItemCount = await forecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await forecastSection.getByRole('row').count();
    if (rowCount > 0) {
      return rowCount;
    }

    const sectionText = await forecastSection.innerText();
    const timeLabelCount = (sectionText.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
    if (timeLabelCount > 0) {
      return timeLabelCount;
    }

    return await forecastSection.getByRole('img').count();
  }).toBe(24);
});
