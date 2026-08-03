// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

  await expect(measurementButton).toBeVisible();

  const panelAlreadyVisible =
    (await measurementRegion.isVisible()) ||
    (await measurementDialog.isVisible()) ||
    (await measurementHeading.isVisible());

  if (!panelAlreadyVisible) {
    await measurementButton.click();
  }

  await expect
    .poll(async () => {
      return (
        (await measurementRegion.isVisible()) ||
        (await measurementDialog.isVisible()) ||
        (await measurementHeading.isVisible())
      );
    })
    .toBe(true);

  let measurementPanel = measurementRegion;
  if (await measurementRegion.isVisible()) {
    measurementPanel = measurementRegion;
  } else if (await measurementDialog.isVisible()) {
    measurementPanel = measurementDialog;
  } else {
    measurementPanel = page.locator('aside, section, div').filter({ has: measurementHeading }).first();
  }

  await expect(measurementPanel).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  await mapCanvas.click({ position: { x: 120, y: 120 } });
  await mapCanvas.click({ position: { x: 220, y: 170 } });
  await mapCanvas.click({ position: { x: 320, y: 130 } });
  await mapCanvas.dblclick({ position: { x: 420, y: 200 } });

  await expect
    .poll(async () => {
      return (await measurementPanel.textContent()) ?? '';
    })
    .toMatch(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
