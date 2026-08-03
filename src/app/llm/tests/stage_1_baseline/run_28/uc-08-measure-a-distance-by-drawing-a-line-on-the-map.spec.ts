// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(measurementButton).toBeVisible();
  await expect(mapViewport).toBeVisible();

  if (!(await measurementPanelHeading.isVisible())) {
    await measurementButton.click();
  }

  await expect(measurementPanelHeading).toBeVisible();

  const mapBox = await mapViewport.boundingBox();
  if (!mapBox) {
    throw new Error('Map viewport has no bounding box.');
  }

  const point1 = {
    x: Math.round(Math.max(20, Math.min(mapBox.width - 20, mapBox.width * 0.65))),
    y: Math.round(Math.max(20, Math.min(mapBox.height - 20, mapBox.height * 0.35)))
  };
  const point2 = {
    x: Math.round(Math.max(20, Math.min(mapBox.width - 20, mapBox.width * 0.75))),
    y: Math.round(Math.max(20, Math.min(mapBox.height - 20, mapBox.height * 0.5)))
  };
  const point3 = {
    x: Math.round(Math.max(20, Math.min(mapBox.width - 20, mapBox.width * 0.85))),
    y: Math.round(Math.max(20, Math.min(mapBox.height - 20, mapBox.height * 0.65)))
  };

  await mapViewport.click({ position: point1 });
  await mapViewport.click({ position: point2 });
  await mapViewport.dblclick({ position: point3 });

  await expect(measurementPanelHeading).toBeVisible();

  await expect.poll(async () => {
    return await measurementPanelHeading.evaluate((node) => {
      const heading = node as HTMLElement;
      const container =
        heading.closest('[role="dialog"], [role="complementary"], [role="region"], aside, section') ??
        heading.parentElement;
      return container?.textContent ?? '';
    });
  }).toMatch(/\b\d+(?:[.,]\d+)?\s?(?:m|km|meter(?:s)?|kilometer(?:s)?)\b/i);
});
