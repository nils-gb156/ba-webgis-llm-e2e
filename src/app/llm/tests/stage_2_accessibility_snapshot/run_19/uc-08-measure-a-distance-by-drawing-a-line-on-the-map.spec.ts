// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapContainer = page.getByTestId('map-container');
  const mapToolbar = page.getByTestId('map-toolbar');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(mapToolbar).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const pressedState = await measurementToggle.getAttribute('aria-pressed');
  if (pressedState !== 'true') {
    await measurementToggle.click();
  }

  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

  await expect
    .poll(async () => {
      const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
      if (await measurementDialog.isVisible()) {
        return true;
      }

      const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
      if (await measurementHeading.isVisible()) {
        return true;
      }

      return false;
    })
    .toBe(true);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box; the map is not interactive.');
  }

  const p1 = { x: Math.round(mapBox.width * 0.4), y: Math.round(mapBox.height * 0.4) };
  const p2 = { x: Math.round(mapBox.width * 0.5), y: Math.round(mapBox.height * 0.52) };
  const p3 = { x: Math.round(mapBox.width * 0.6), y: Math.round(mapBox.height * 0.42) };
  const p4 = { x: Math.round(mapBox.width * 0.7), y: Math.round(mapBox.height * 0.56) };

  await mapContainer.click({ position: p1 });
  await mapContainer.click({ position: p2 });
  await mapContainer.click({ position: p3 });
  await mapContainer.dblclick({ position: p4 });

  const lengthValue = page.getByText(
    /\b\d+(?:[.,]\d+)?\s*(?:m|km|ft|mi|nm|meter(?:s)?|kilometer(?:s)?)\b/i
  ).first();

  await expect(lengthValue).toBeVisible();
});
