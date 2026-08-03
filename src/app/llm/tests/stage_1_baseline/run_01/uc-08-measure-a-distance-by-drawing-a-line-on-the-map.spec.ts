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
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementPanelHeading).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();

  const width = box!.width;
  const height = box!.height;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const points = [
    { x: clamp(width * 0.62, 20, width - 20), y: clamp(height * 0.28, 20, height - 20) },
    { x: clamp(width * 0.74, 20, width - 20), y: clamp(height * 0.42, 20, height - 20) },
    { x: clamp(width * 0.58, 20, width - 20), y: clamp(height * 0.58, 20, height - 20) },
    { x: clamp(width * 0.78, 20, width - 20), y: clamp(height * 0.70, 20, height - 20) }
  ];

  await mapCanvas.click({ position: points[0] });
  await mapCanvas.click({ position: points[1] });
  await mapCanvas.click({ position: points[2] });
  await mapCanvas.dblclick({ position: points[3] });

  await expect(measurementPanelHeading).toBeVisible();

  await expect
    .poll(async () => {
      return await measurementPanelHeading.evaluate((node) => {
        const panel =
          node.closest('[role="dialog"], [role="region"], aside, section, form') ??
          node.parentElement?.parentElement ??
          node.parentElement ??
          node;
        return (panel.textContent ?? '').replace(/\s+/g, ' ').trim();
      });
    })
    .toMatch(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km|ft|yd|mi)\b/i);
});
