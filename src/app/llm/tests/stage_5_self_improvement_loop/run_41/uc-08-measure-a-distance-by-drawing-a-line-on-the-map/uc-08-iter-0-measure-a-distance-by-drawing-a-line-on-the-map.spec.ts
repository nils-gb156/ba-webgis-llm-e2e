// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const pressedBefore = await measurementToggle.getAttribute('aria-pressed');
  if (pressedBefore !== 'true') {
    await measurementToggle.click();
  }

  const pressedAfter = await measurementToggle.getAttribute('aria-pressed');
  if (pressedAfter !== null) {
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
  }

  try {
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  } catch {
    await expect(page.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible({
      timeout: 5000
    });
  }

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const firstPoint = {
    x: Math.round(box.width * 0.40),
    y: Math.round(box.height * 0.34)
  };
  const secondPoint = {
    x: Math.round(box.width * 0.50),
    y: Math.round(box.height * 0.45)
  };
  const thirdPoint = {
    x: Math.round(box.width * 0.62),
    y: Math.round(box.height * 0.36)
  };

  await mapContainer.click({ position: firstPoint });
  await mapContainer.click({ position: secondPoint });
  await mapContainer.dblclick({ position: thirdPoint });

  const measurementValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:km|m)\b/i;
  const measurementDialog = page.getByRole('dialog');

  if (await measurementDialog.count()) {
    await expect(measurementDialog.getByText(measurementValuePattern).first()).toBeVisible();
  } else {
    await expect(page.getByText(measurementValuePattern).first()).toBeVisible();
  }
});
