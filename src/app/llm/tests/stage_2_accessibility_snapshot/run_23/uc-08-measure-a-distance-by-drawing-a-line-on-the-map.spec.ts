// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await measurementToggle.click();

  await expect.poll(async () => {
    const candidates = [
      page.getByRole('dialog', { name: /measurement/i }).first(),
      page.getByRole('region', { name: /measurement/i }).first(),
      page.getByRole('heading', { name: /measurement/i }).first(),
      page.getByText(/(?:length|distance|area)/i).first()
    ];

    for (const candidate of candidates) {
      if (await candidate.isVisible()) {
        return true;
      }
    }

    return (await measurementToggle.getAttribute('aria-pressed')) === 'true';
  }).toBe(true);

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const start = {
    x: Math.round(box.width * 0.68),
    y: Math.round(box.height * 0.32)
  };
  const middle = {
    x: Math.round(box.width * 0.76),
    y: Math.round(box.height * 0.42)
  };
  const end = {
    x: Math.round(box.width * 0.84),
    y: Math.round(box.height * 0.52)
  };

  await mapContainer.click({ position: start });
  await mapContainer.click({ position: middle });
  await mapContainer.dblclick({ position: end });

  const measurementResult = page
    .getByText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|dm|m|km|meters?|kilometers?)\b/i)
    .first();

  await expect(measurementResult).toBeVisible();
});
