// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementDialog = page.getByRole('dialog').filter({ hasText: /measurement|length/i }).first();
  const measurementHeading = page.getByRole('heading', { name: /measurement/i }).first();

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const panelAlreadyVisible =
    (await measurementDialog.isVisible()) || (await measurementHeading.isVisible());

  if (!panelAlreadyVisible) {
    await measurementToggle.click();
  }

  await expect
    .poll(async () => {
      return (await measurementDialog.isVisible()) || (await measurementHeading.isVisible());
    })
    .toBe(true);

  if (await measurementDialog.isVisible()) {
    await expect(measurementDialog).toBeVisible();
  } else {
    await expect(measurementHeading).toBeVisible();
  }

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(Math.round(value), min), max);

  const margin = 40;
  const maxX = Math.max(margin + 1, Math.round(box.width) - margin);
  const maxY = Math.max(margin + 1, Math.round(box.height) - margin);

  const points = [
    { x: clamp(box.width * 0.25, margin, maxX), y: clamp(box.height * 0.55, margin, maxY) },
    { x: clamp(box.width * 0.4, margin, maxX), y: clamp(box.height * 0.42, margin, maxY) },
    { x: clamp(box.width * 0.58, margin, maxX), y: clamp(box.height * 0.6, margin, maxY) },
    { x: clamp(box.width * 0.72, margin, maxX), y: clamp(box.height * 0.48, margin, maxY) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  const nonZeroLengthValue = /\b(?=[\d\s.,]*[1-9])\d[\d\s.,]*\s?(?:m|km)\b/i;

  if (await measurementDialog.isVisible()) {
    await expect(measurementDialog.getByText(nonZeroLengthValue).first()).toBeVisible();
  } else {
    await expect(page.getByText(nonZeroLengthValue).first()).toBeVisible();
  }
});
