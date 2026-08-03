// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  if (!(await measurementPanelHeading.isVisible())) {
    await measurementButton.click();
  }

  await expect(measurementPanelHeading).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map canvas bounding box is not available.');
  }

  const firstPoint = { x: box.width * 0.25, y: box.height * 0.35 };
  const secondPoint = { x: box.width * 0.45, y: box.height * 0.42 };
  const finalPoint = { x: box.width * 0.65, y: box.height * 0.55 };

  await mapCanvas.click({ position: firstPoint });
  await mapCanvas.click({ position: secondPoint });
  await mapCanvas.dblclick({ position: finalPoint });

  const lengthWithUnit = page.getByText(
    /\b(?:[1-9]\d*(?:[.,]\d+)?|0[.,]\d*[1-9]\d*)\s?(?:mm|cm|m|km)\b/i
  );
  await expect(lengthWithUnit.first()).toBeVisible();
});
