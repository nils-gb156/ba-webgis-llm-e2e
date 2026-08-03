// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const measurementPanel = page
    .locator('aside, section, [role="region"], [role="dialog"]')
    .filter({ has: measurementHeading })
    .first();
  const mapContainer = page.locator('.ol-viewport').first();

  await expect(measurementButton).toBeVisible();
  await expect(mapContainer).toBeVisible();

  if (!(await measurementHeading.isVisible())) {
    const isPressed = await measurementButton.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementHeading).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.round(mapBox.width * 0.62), y: Math.round(mapBox.height * 0.35) },
    { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.42) },
    { x: Math.round(mapBox.width * 0.82), y: Math.round(mapBox.height * 0.50) },
    { x: Math.round(mapBox.width * 0.88), y: Math.round(mapBox.height * 0.60) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  await expect(measurementPanel).toContainText(/\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i);
});
