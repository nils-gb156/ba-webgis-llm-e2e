// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const isMeasurementPanelVisible = async (): Promise<boolean> => {
    return (await measurementDialog.isVisible()) || (await measurementHeading.isVisible());
  };

  if (!(await isMeasurementPanelVisible())) {
    await measurementToggle.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const point1 = { x: Math.round(box.width * 0.38), y: Math.round(box.height * 0.40) };
  const point2 = { x: Math.round(box.width * 0.48), y: Math.round(box.height * 0.47) };
  const point3 = { x: Math.round(box.width * 0.58), y: Math.round(box.height * 0.55) };
  const point4 = { x: Math.round(box.width * 0.64), y: Math.round(box.height * 0.62) };

  await mapContainer.click({ position: point1 });
  await mapContainer.click({ position: point2 });
  await mapContainer.click({ position: point3 });
  await mapContainer.dblclick({ position: point4 });

  const getMeasurementText = async (): Promise<string> => {
    if (await measurementDialog.isVisible()) {
      return await measurementDialog.innerText();
    }
    return await page.locator('body').innerText();
  };

  await expect.poll(getMeasurementText).toMatch(
    /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\s?(?:m|km)\b/
  );
});
