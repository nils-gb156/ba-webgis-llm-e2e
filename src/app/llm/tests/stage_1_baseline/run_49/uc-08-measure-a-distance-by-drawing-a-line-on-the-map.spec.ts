// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  if ((await measurementButton.getAttribute('aria-pressed')) !== 'true') {
    await measurementButton.click();
  }

  await expect(measurementButton).toHaveAttribute('aria-pressed', 'true');

  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect
    .poll(async () => {
      return (
        (await measurementDialog.count()) +
        (await measurementRegion.count()) +
        (await measurementHeading.count())
      );
    })
    .toBeGreaterThan(0);

  let measurementPanelScope = page.locator('body');

  if ((await measurementDialog.count()) > 0) {
    await expect(measurementDialog).toBeVisible();
    measurementPanelScope = measurementDialog;
  } else if ((await measurementRegion.count()) > 0) {
    await expect(measurementRegion).toBeVisible();
    measurementPanelScope = measurementRegion;
  } else {
    await expect(measurementHeading).toBeVisible();
  }

  const lengthPattern = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i;
  const initialLengthTexts = await measurementPanelScope.getByText(lengthPattern).allTextContents();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box is not available.');
  }

  const points = [
    { x: Math.round(box.width * 0.58), y: Math.round(box.height * 0.34) },
    { x: Math.round(box.width * 0.68), y: Math.round(box.height * 0.42) },
    { x: Math.round(box.width * 0.78), y: Math.round(box.height * 0.52) },
    { x: Math.round(box.width * 0.86), y: Math.round(box.height * 0.61) }
  ];

  await mapCanvas.click({ position: points[0] });
  await mapCanvas.click({ position: points[1] });
  await mapCanvas.click({ position: points[2] });
  await mapCanvas.dblclick({ position: points[3] });

  await expect
    .poll(async () => {
      const texts = await measurementPanelScope.getByText(lengthPattern).allTextContents();
      const hasChanged =
        texts.length > initialLengthTexts.length ||
        texts.some((text, index) => text !== initialLengthTexts[index]);

      return hasChanged ? texts.join(' | ') : '';
    })
    .toMatch(lengthPattern);

  await expect(measurementPanelScope.getByText(lengthPattern).first()).toBeVisible();
});
