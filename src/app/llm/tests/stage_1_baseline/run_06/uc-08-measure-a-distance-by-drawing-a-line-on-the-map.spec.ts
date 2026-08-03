// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  if (!(await measurementHeading.isVisible())) {
    const isPressed = await measurementButton.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await measurementButton.click();
    }
  }

  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementComplementary = page.getByRole('complementary', { name: 'Measurement', exact: true });

  let measurementPanelTextLocator = page.locator('body');
  let hasScopedMeasurementPanel = false;

  if (await measurementDialog.isVisible()) {
    await expect(measurementDialog).toBeVisible();
    measurementPanelTextLocator = measurementDialog;
    hasScopedMeasurementPanel = true;
  } else if (await measurementRegion.isVisible()) {
    await expect(measurementRegion).toBeVisible();
    measurementPanelTextLocator = measurementRegion;
    hasScopedMeasurementPanel = true;
  } else if (await measurementComplementary.isVisible()) {
    await expect(measurementComplementary).toBeVisible();
    measurementPanelTextLocator = measurementComplementary;
    hasScopedMeasurementPanel = true;
  } else {
    await expect(measurementHeading).toBeVisible();
  }

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map canvas bounding box is not available.');
  }

  const points = [
    { x: Math.floor(box.width * 0.62), y: Math.floor(box.height * 0.30) },
    { x: Math.floor(box.width * 0.72), y: Math.floor(box.height * 0.40) },
    { x: Math.floor(box.width * 0.80), y: Math.floor(box.height * 0.52) },
    { x: Math.floor(box.width * 0.86), y: Math.floor(box.height * 0.64) }
  ];

  await mapCanvas.click({ position: points[0] });
  await mapCanvas.click({ position: points[1] });
  await mapCanvas.click({ position: points[2] });
  await mapCanvas.dblclick({ position: points[3] });

  const scopedLengthPattern = /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/;
  const fallbackLengthPattern = /\bLength\b[\s\S]*\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i;

  await expect
    .poll(async () => (await measurementPanelTextLocator.textContent()) ?? '')
    .toMatch(hasScopedMeasurementPanel ? scopedLengthPattern : fallbackLengthPattern);
});
