// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const measurementDialog = page.getByRole('dialog', { name: /measurement/i });
  const measurementRegion = page.getByRole('region', { name: /measurement/i });
  const measurementInstruction = page.getByText(/double-?click.*finish|finish.*measurement|length|distance/i);

  const isMeasurementPanelVisible = async (): Promise<boolean> => {
    const ariaPressed = await measurementToggle.getAttribute('aria-pressed');
    const ariaExpanded = await measurementToggle.getAttribute('aria-expanded');

    if (ariaPressed === 'true' || ariaExpanded === 'true') {
      return true;
    }

    for (const locator of [
      measurementHeading,
      measurementDialog,
      measurementRegion,
      measurementInstruction
    ]) {
      if (await locator.first().isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  };

  if (!(await isMeasurementPanelVisible())) {
    await measurementToggle.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const point = (xFactor: number, yFactor: number) => ({
    x: Math.min(Math.max(20, Math.round(mapBox.width * xFactor)), Math.round(mapBox.width) - 20),
    y: Math.min(Math.max(20, Math.round(mapBox.height * yFactor)), Math.round(mapBox.height) - 20)
  });

  const p1 = point(0.45, 0.35);
  const p2 = point(0.52, 0.46);
  const p3 = point(0.60, 0.56);
  const p4 = point(0.67, 0.43);

  await mapContainer.click({ position: p1 });
  await mapContainer.click({ position: p2 });
  await mapContainer.click({ position: p3 });
  await mapContainer.dblclick({ position: p4 });

  await expect.poll(async () => await page.locator('body').innerText()).toMatch(
    /\b(?:Length|Distance)\b[\s\S]{0,40}\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km|ft|yd|mi|nm)\b|\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km|ft|yd|mi|nm)\b/i
  );
});
