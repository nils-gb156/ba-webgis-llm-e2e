// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const initialPressed = await measurementToggle.getAttribute('aria-pressed');
  if (initialPressed !== 'true') {
    await measurementToggle.click();
  }

  await expect.poll(async () => {
    const pressed = await measurementToggle.getAttribute('aria-pressed');
    const measurementHeadingVisible = await page
      .getByRole('heading', { name: /Measure/i })
      .isVisible()
      .catch(() => false);
    const measurementDialogVisible = await page
      .getByRole('dialog', { name: /Measure/i })
      .isVisible()
      .catch(() => false);
    const measurementRegionVisible = await page
      .getByRole('region', { name: /Measure/i })
      .isVisible()
      .catch(() => false);

    return pressed === 'true' || measurementHeadingVisible || measurementDialogVisible || measurementRegionVisible;
  }).toBe(true);

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const point1 = {
    x: Math.round(box.width * 0.3),
    y: Math.round(box.height * 0.35)
  };
  const point2 = {
    x: Math.round(box.width * 0.5),
    y: Math.round(box.height * 0.45)
  };
  const point3 = {
    x: Math.round(box.width * 0.7),
    y: Math.round(box.height * 0.55)
  };

  await mapContainer.click({ position: point1 });
  await mapContainer.click({ position: point2 });
  await mapContainer.dblclick({ position: point3 });

  const measurementValue = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/).first();
  await expect(measurementValue).toBeVisible();
});
