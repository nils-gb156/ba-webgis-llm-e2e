// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const mapToolbar = page.getByTestId('map-toolbar');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurement = page.getByTestId('measurement');

  await expect(mapContainer).toBeVisible();
  await expect(mapToolbar).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await expect
    .poll(async () => {
      const center = await getMapCenter(page);
      return Array.isArray(center) ? center.length : 0;
    })
    .toBe(2);

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanel).toBeVisible();
  await expect(measurement).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();

  const width = box!.width;
  const height = box!.height;

  const points = [
    { x: Math.round(width * 0.45), y: Math.round(height * 0.55) },
    { x: Math.round(width * 0.55), y: Math.round(height * 0.48) },
    { x: Math.round(width * 0.65), y: Math.round(height * 0.60) },
    { x: Math.round(width * 0.75), y: Math.round(height * 0.52) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  await expect(measurementPanel).toContainText(/\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
