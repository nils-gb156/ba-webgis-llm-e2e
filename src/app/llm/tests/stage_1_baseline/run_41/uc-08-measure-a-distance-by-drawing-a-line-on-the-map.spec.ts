// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(measurementButton).toBeVisible();

  const panelAlreadyVisible =
    (await measurementDialog.isVisible()) ||
    (await measurementRegion.isVisible()) ||
    (await measurementHeading.isVisible());

  if (!panelAlreadyVisible) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  let panelTextSource = page.locator('body');
  let scopedToPanel = false;

  if (await measurementDialog.isVisible()) {
    await expect(measurementDialog).toBeVisible();
    panelTextSource = measurementDialog;
    scopedToPanel = true;
  } else if (await measurementRegion.isVisible()) {
    await expect(measurementRegion).toBeVisible();
    panelTextSource = measurementRegion;
    scopedToPanel = true;
  } else {
    try {
      await expect(measurementDialog).toBeVisible({ timeout: 3000 });
      panelTextSource = measurementDialog;
      scopedToPanel = true;
    } catch {
      try {
        await expect(measurementRegion).toBeVisible({ timeout: 3000 });
        panelTextSource = measurementRegion;
        scopedToPanel = true;
      } catch {
        await expect(measurementHeading).toBeVisible();
      }
    }
  }

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const mapSize = await mapCanvas.evaluate((canvas) => ({
    width: canvas.clientWidth,
    height: canvas.clientHeight
  }));

  expect(mapSize.width).toBeGreaterThan(200);
  expect(mapSize.height).toBeGreaterThan(200);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const point = (x: number, y: number) => ({
    x: clamp(Math.round(x), 10, mapSize.width - 10),
    y: clamp(Math.round(y), 10, mapSize.height - 10)
  });

  const points = [
    point(mapSize.width * 0.68, mapSize.height * 0.32),
    point(mapSize.width * 0.79, mapSize.height * 0.45),
    point(mapSize.width * 0.70, mapSize.height * 0.60),
    point(mapSize.width * 0.83, mapSize.height * 0.72)
  ];

  await mapCanvas.click({ position: points[0] });
  await mapCanvas.click({ position: points[1] });
  await mapCanvas.click({ position: points[2] });
  await mapCanvas.dblclick({ position: points[3] });

  const resultPattern = scopedToPanel
    ? /\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i
    : /(?:Length|Distance)\D*\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;

  await expect.poll(async () => ((await panelTextSource.textContent()) ?? '').replace(/\s+/g, ' ')).toMatch(resultPattern);
});
