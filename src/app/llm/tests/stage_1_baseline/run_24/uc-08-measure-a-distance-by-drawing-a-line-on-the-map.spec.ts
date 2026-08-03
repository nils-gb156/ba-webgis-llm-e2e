// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(measurementButton).toBeVisible();
  await expect(mapViewport).toBeVisible();

  if (!(await measurementHeading.isVisible())) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementHeading).toBeVisible();

  const pressedAfterOpen = await measurementButton.getAttribute('aria-pressed');
  if (pressedAfterOpen !== null) {
    await expect(measurementButton).toHaveAttribute('aria-pressed', 'true');
  }

  const box = await mapViewport.boundingBox();
  if (!box) {
    throw new Error('Map viewport bounding box is not available.');
  }

  const p1 = { x: Math.round(box.width * 0.25), y: Math.round(box.height * 0.35) };
  const p2 = { x: Math.round(box.width * 0.45), y: Math.round(box.height * 0.4) };
  const p3 = { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.52) };
  const p4 = { x: Math.round(box.width * 0.78), y: Math.round(box.height * 0.58) };

  await mapViewport.click({ position: p1 });
  await mapViewport.click({ position: p2 });
  await mapViewport.click({ position: p3 });
  await mapViewport.dblclick({ position: p4 });

  await expect(page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km|ft|mi)\b/i).first()).toBeVisible();
});
