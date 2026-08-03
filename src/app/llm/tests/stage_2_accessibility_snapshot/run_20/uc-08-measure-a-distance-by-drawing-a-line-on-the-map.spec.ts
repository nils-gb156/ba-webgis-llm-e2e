// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const isMeasurementPanelVisible = async () => {
    const candidates = [
      page.getByRole('dialog', { name: /measurement/i }).first(),
      page.getByRole('region', { name: /measurement/i }).first(),
      page.getByRole('heading', { name: 'Measurement', exact: true }).first(),
      page.getByText(/^(Length|Distance)$/i).first()
    ];

    for (const candidate of candidates) {
      if (await candidate.isVisible()) {
        return true;
      }
    }
    return false;
  };

  await measurementToggle.click();

  await expect
    .poll(async () => {
      const ariaPressed = await measurementToggle.getAttribute('aria-pressed');
      const ariaExpanded = await measurementToggle.getAttribute('aria-expanded');
      const panelVisible = await isMeasurementPanelVisible();
      return ariaPressed === 'true' || ariaExpanded === 'true' || panelVisible;
    })
    .toBe(true);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const marginX = Math.max(20, Math.min(80, mapBox.width / 6));
  const marginY = Math.max(20, Math.min(80, mapBox.height / 6));
  const point = (xRatio: number, yRatio: number) => ({
    x: Math.round(Math.min(Math.max(mapBox.width * xRatio, marginX), mapBox.width - marginX)),
    y: Math.round(Math.min(Math.max(mapBox.height * yRatio, marginY), mapBox.height - marginY))
  });

  await mapContainer.click({ position: point(0.35, 0.35) });
  await mapContainer.click({ position: point(0.5, 0.45) });
  await mapContainer.click({ position: point(0.65, 0.55) });
  await mapContainer.dblclick({ position: point(0.78, 0.65) });

  await expect.poll(async () => await isMeasurementPanelVisible()).toBe(true);

  const measurementResult = page
    .getByText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i)
    .first();

  await expect(measurementResult).toBeVisible();
});
