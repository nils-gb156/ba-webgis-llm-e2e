// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const mapContainer = page.getByTestId('map-container');
  const toolbar = page.getByTestId('map-toolbar');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(toolbar).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanel).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: { x: mapBox.width * 0.42, y: mapBox.height * 0.38 }
  });
  await mapContainer.click({
    position: { x: mapBox.width * 0.56, y: mapBox.height * 0.48 }
  });
  await mapContainer.dblclick({
    position: { x: mapBox.width * 0.7, y: mapBox.height * 0.4 }
  });

  await expect(
    measurementPanel.getByText(/\b\d+(?:[.,]\d+)?\s?(m|km)\b/i)
  ).toBeVisible();
});
