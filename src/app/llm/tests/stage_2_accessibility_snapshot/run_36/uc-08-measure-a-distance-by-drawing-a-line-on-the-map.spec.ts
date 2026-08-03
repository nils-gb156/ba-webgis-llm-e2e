// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementButton = page.getByTestId('measurement-toggle');
  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(measurementButton).toBeVisible();

  if (!(await measurementPanelHeading.isVisible())) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementPanelHeading).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.floor(box.width * 0.55), y: Math.floor(box.height * 0.35) },
    { x: Math.floor(box.width * 0.68), y: Math.floor(box.height * 0.45) },
    { x: Math.floor(box.width * 0.78), y: Math.floor(box.height * 0.58) },
    { x: Math.floor(box.width * 0.86), y: Math.floor(box.height * 0.70) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  const lengthValue = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i).first();
  await expect(lengthValue).toBeVisible();
});
