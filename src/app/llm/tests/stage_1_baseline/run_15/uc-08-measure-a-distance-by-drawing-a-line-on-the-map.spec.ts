// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const mapCanvas = page.locator('canvas').first();

  const measurementPanelCandidates = [
    page.getByRole('dialog', { name: 'Measurement', exact: true }),
    page.getByRole('region', { name: 'Measurement', exact: true }),
    page.getByRole('complementary', { name: 'Measurement', exact: true }),
    page.getByRole('tabpanel', { name: 'Measurement', exact: true }),
    page.getByRole('dialog').filter({ has: measurementHeading }),
    page.getByRole('region').filter({ has: measurementHeading }),
    page.getByRole('complementary').filter({ has: measurementHeading }),
    page.getByRole('tabpanel').filter({ has: measurementHeading }),
    page.getByRole('group').filter({ has: measurementHeading })
  ];

  const isMeasurementPanelVisible = async () => {
    if (await measurementHeading.isVisible().catch(() => false)) {
      return true;
    }

    for (const candidate of measurementPanelCandidates) {
      if (await candidate.isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  };

  await expect(measurementButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  if (!(await isMeasurementPanelVisible())) {
    await measurementButton.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas has no bounding box.');
  }

  const points = [
    { x: Math.round(box.width * 0.6), y: Math.round(box.height * 0.35) },
    { x: Math.round(box.width * 0.7), y: Math.round(box.height * 0.45) },
    { x: Math.round(box.width * 0.8), y: Math.round(box.height * 0.55) },
    { x: Math.round(box.width * 0.85), y: Math.round(box.height * 0.65) }
  ];

  await mapCanvas.click({ position: points[0] });
  await mapCanvas.click({ position: points[1] });
  await mapCanvas.click({ position: points[2] });
  await mapCanvas.dblclick({ position: points[3] });

  const lengthPattern = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|yd|mi|nm)\b/i;

  await expect.poll(async () => {
    for (const candidate of measurementPanelCandidates) {
      if (await candidate.isVisible().catch(() => false)) {
        const result = candidate.getByText(lengthPattern).first();
        if (await result.isVisible().catch(() => false)) {
          return true;
        }
      }
    }

    return false;
  }).toBe(true);
});
