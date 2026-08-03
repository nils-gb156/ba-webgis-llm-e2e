// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  if (!(await measurementHeading.isVisible())) {
    await measurementButton.click();
  }

  await expect(measurementHeading).toBeVisible();

  const lengthPattern = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|mi)\b/i;
  const lengthValues = page.getByText(lengthPattern);
  const initialLengthValueCount = await lengthValues.count();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas has no bounding box.');
  }

  const position = (xRatio: number, yRatio: number) => ({
    x: Math.min(Math.max(20, Math.round(box.width * xRatio)), Math.round(box.width - 20)),
    y: Math.min(Math.max(20, Math.round(box.height * yRatio)), Math.round(box.height - 20))
  });

  await mapCanvas.click({ position: position(0.25, 0.35) });
  await mapCanvas.click({ position: position(0.45, 0.45) });
  await mapCanvas.dblclick({ position: position(0.65, 0.55) });

  await expect.poll(async () => await lengthValues.count()).toBeGreaterThan(initialLengthValueCount);
  await expect(lengthValues.last()).toBeVisible();
});
