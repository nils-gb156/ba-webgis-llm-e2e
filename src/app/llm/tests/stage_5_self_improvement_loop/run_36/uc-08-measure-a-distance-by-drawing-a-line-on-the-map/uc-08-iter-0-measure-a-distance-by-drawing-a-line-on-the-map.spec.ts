// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from "../../../../map-model-helpers";

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementButton = page.getByTestId('measurement-toggle');
  const body = page.locator('body');
  const measurementValuePattern = /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/g;

  const isMeasurementPanelVisible = async (): Promise<boolean> => {
    if (await page.getByRole('dialog', { name: /measurement/i }).isVisible()) {
      return true;
    }
    if (await page.getByRole('region', { name: /measurement/i }).isVisible()) {
      return true;
    }
    if (await page.getByRole('heading', { name: /measurement/i }).isVisible()) {
      return true;
    }
    return (await measurementButton.getAttribute('aria-pressed')) === 'true';
  };

  await expect(mapContainer).toBeVisible();
  await expect(measurementButton).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const initialBodyText = (await body.textContent()) ?? '';
  const initialMeasurementValueCount = initialBodyText.match(measurementValuePattern)?.length ?? 0;

  if (!(await isMeasurementPanelVisible())) {
    await measurementButton.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  await mapContainer.click({ position: { x: 700, y: 330 } });
  await mapContainer.click({ position: { x: 820, y: 390 } });
  await mapContainer.dblclick({ position: { x: 940, y: 470 } });

  await expect.poll(async () => {
    const text = (await body.textContent()) ?? '';
    return text.match(measurementValuePattern)?.length ?? 0;
  }).toBeGreaterThan(initialMeasurementValueCount);
});
