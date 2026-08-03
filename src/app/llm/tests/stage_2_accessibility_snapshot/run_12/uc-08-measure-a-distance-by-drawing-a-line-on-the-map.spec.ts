// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  if (!(await measurementHeading.isVisible())) {
    await expect(measurementToggle).toBeVisible();
    const isPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await measurementToggle.click();
    }
  }

  await expect(measurementHeading).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.round(mapBox.width * 0.45), y: Math.round(mapBox.height * 0.35) },
    { x: Math.round(mapBox.width * 0.52), y: Math.round(mapBox.height * 0.43) },
    { x: Math.round(mapBox.width * 0.60), y: Math.round(mapBox.height * 0.50) },
    { x: Math.round(mapBox.width * 0.68), y: Math.round(mapBox.height * 0.58) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  const lengthValuePattern =
    /\b(\d+(?:[.,]\d+)?)\s?(?:m|km|meter|meters|kilometer|kilometers)\b/i;

  await expect
    .poll(async () => {
      const texts = await page.getByText(lengthValuePattern).allTextContents();
      return texts.some((text) => {
        const match = text.match(lengthValuePattern);
        if (!match) {
          return false;
        }
        const numericValue = Number(match[1].replace(',', '.'));
        return Number.isFinite(numericValue) && numericValue > 0;
      });
    })
    .toBe(true);
});
