// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanel).toBeVisible();
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.48),
      y: Math.round(mapBox.height * 0.38)
    }
  });
  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.6),
      y: Math.round(mapBox.height * 0.48)
    }
  });
  await mapContainer.dblclick({
    position: {
      x: Math.round(mapBox.width * 0.74),
      y: Math.round(mapBox.height * 0.4)
    }
  });

  const measurementResult = page
    .getByRole('tooltip')
    .filter({ hasText: /\b\d+(?:[.,]\d+)?\s?(m|km)\b/i })
    .first();

  await expect(measurementPanel).toBeVisible();
  await expect(measurementResult).toBeVisible();
  await expect(measurementResult).toHaveText(/\b\d+(?:[.,]\d+)?\s?(m|km)\b/i);
});
