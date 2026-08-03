// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementButton = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementButton).toBeVisible();

  await measurementButton.click();

  const measurementHeading = page.getByRole('heading', { name: /^Measurement$/i });
  await expect(measurementHeading).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.round(box.width * 0.35), y: Math.round(box.height * 0.35) },
    { x: Math.round(box.width * 0.5), y: Math.round(box.height * 0.42) },
    { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.58) },
    { x: Math.round(box.width * 0.75), y: Math.round(box.height * 0.5) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  await expect.poll(async () => {
    const texts = await page.getByText(/\d+(?:[.,]\d+)?\s*(?:m|km)\b/i).allInnerTexts();

    return texts.some((text) => {
      const match = text.match(/(\d+(?:[.,]\d+)?)\s*(m|km)\b/i);
      if (!match) {
        return false;
      }

      const value = Number(match[1].replace(',', '.'));
      return Number.isFinite(value) && value > 0;
    });
  }).toBe(true);

  await expect(measurementHeading).toBeVisible();
});
