// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  const isMeasurementPanelVisible = async (): Promise<boolean> => {
    if (await measurementDialog.isVisible()) {
      return true;
    }
    if (await measurementRegion.isVisible()) {
      return true;
    }
    if (await measurementHeading.isVisible()) {
      return true;
    }
    return false;
  };

  const getLengthValueMatches = async (): Promise<string[]> => {
    const pageText = (await page.locator('body').innerText()).replace(/\u00a0/g, ' ');
    return [...pageText.matchAll(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/g)].map((match) => match[0]);
  };

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const initialLengthMatches = await getLengthValueMatches();

  if (!(await isMeasurementPanelVisible())) {
    const pressed = await measurementToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementToggle.click();
    } else {
      await expect.poll(isMeasurementPanelVisible).toBe(true);
    }
  }

  if (!(await isMeasurementPanelVisible())) {
    await measurementToggle.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.28),
      y: Math.round(box.height * 0.35)
    }
  });
  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.45),
      y: Math.round(box.height * 0.42)
    }
  });
  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.60),
      y: Math.round(box.height * 0.48)
    }
  });
  await mapContainer.dblclick({
    position: {
      x: Math.round(box.width * 0.74),
      y: Math.round(box.height * 0.56)
    }
  });

  await expect.poll(isMeasurementPanelVisible).toBe(true);
  await expect
    .poll(async () => (await getLengthValueMatches()).length)
    .toBeGreaterThan(initialLengthMatches.length);
});
