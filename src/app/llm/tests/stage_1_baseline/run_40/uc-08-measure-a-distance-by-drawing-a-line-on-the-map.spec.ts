// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/', { waitUntil: 'domcontentloaded' });

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(measurementButton).toBeVisible();

  const panelAlreadyVisible = await measurementHeading.isVisible().catch(() => false);
  if (!panelAlreadyVisible) {
    await measurementButton.click();
  }

  await expect(measurementHeading).toBeVisible();

  let measurementContainer = page.locator('body');
  let hasScopedMeasurementContainer = false;

  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  if (await measurementDialog.isVisible().catch(() => false)) {
    measurementContainer = measurementDialog;
    hasScopedMeasurementContainer = true;
  } else {
    const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
    if (await measurementRegion.isVisible().catch(() => false)) {
      measurementContainer = measurementRegion;
      hasScopedMeasurementContainer = true;
    }
  }

  const unitRegex = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;
  const measurementValues = measurementContainer.getByText(unitRegex);
  const measurementValueCountBefore = await measurementValues.count();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();

  const width = box!.width;
  const height = box!.height;
  const point1 = { x: Math.round(width * 0.58), y: Math.round(height * 0.38) };
  const point2 = { x: Math.round(width * 0.68), y: Math.round(height * 0.46) };
  const point3 = { x: Math.round(width * 0.78), y: Math.round(height * 0.54) };
  const point4 = { x: Math.round(width * 0.86), y: Math.round(height * 0.60) };

  await mapCanvas.click({ position: point1 });
  await mapCanvas.click({ position: point2 });
  await mapCanvas.click({ position: point3 });
  await mapCanvas.dblclick({ position: point4 });

  await expect.poll(async () => await measurementValues.count()).toBeGreaterThan(measurementValueCountBefore);

  if (hasScopedMeasurementContainer) {
    await expect(measurementValues.first()).toBeVisible();
  }
});
