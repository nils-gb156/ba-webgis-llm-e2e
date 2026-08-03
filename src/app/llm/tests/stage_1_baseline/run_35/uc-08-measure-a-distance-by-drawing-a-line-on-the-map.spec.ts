// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const mapCanvas = page.locator('canvas').first();

  await expect(measurementButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  if (!(await measurementPanelHeading.isVisible())) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementPanelHeading).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map canvas has no bounding box.');
  }

  const firstPoint = {
    x: Math.round(box.width * 0.55),
    y: Math.round(box.height * 0.35)
  };
  const secondPoint = {
    x: Math.round(box.width * 0.7),
    y: Math.round(box.height * 0.42)
  };
  const thirdPoint = {
    x: Math.round(box.width * 0.82),
    y: Math.round(box.height * 0.58)
  };

  await mapCanvas.click({ position: firstPoint });
  await mapCanvas.click({ position: secondPoint });
  await mapCanvas.dblclick({ position: thirdPoint });

  await expect(page.getByText(/\b\d+(?:[.,]\d+)?\s?(mm|cm|m|km|ft|mi)\b/i).first()).toBeVisible();
});
