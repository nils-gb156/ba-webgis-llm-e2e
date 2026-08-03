// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementContent = page.getByTestId('measurement');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanel).toBeVisible();
  await expect(measurementContent).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const start = {
    x: Math.round(box.width * 0.62),
    y: Math.round(box.height * 0.38)
  };
  const middle = {
    x: Math.round(box.width * 0.72),
    y: Math.round(box.height * 0.5)
  };
  const end = {
    x: Math.round(box.width * 0.82),
    y: Math.round(box.height * 0.62)
  };

  await mapContainer.click({ position: start });
  await mapContainer.click({ position: middle });
  await mapContainer.dblclick({ position: end });

  await expect(measurementPanel).toBeVisible();
  await expect.poll(async () =>
    (((await measurementPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim())
  ).toMatch(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
