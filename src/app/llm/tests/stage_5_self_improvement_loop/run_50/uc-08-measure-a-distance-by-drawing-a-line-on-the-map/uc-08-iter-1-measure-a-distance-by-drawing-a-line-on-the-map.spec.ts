// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const app = page.getByRole('application', { name: 'webgis map', exact: true });
  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

  await expect(app).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  if (!(await measurementPanel.isVisible())) {
    const pressed = await measurementToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementToggle.click();
    }
  }

  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(measurementPanel).toBeVisible();
  await expect(measurementDialog).toBeVisible();

  const modeSelect = measurementDialog.getByRole('combobox', { name: 'Mode', exact: true });
  await expect(modeSelect).toBeVisible();
  await modeSelect.selectOption({ label: 'Distance' });

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const firstPoint = {
    x: Math.round(mapBox.width * 0.62),
    y: Math.round(mapBox.height * 0.52)
  };
  const secondPoint = {
    x: Math.round(mapBox.width * 0.74),
    y: Math.round(mapBox.height * 0.62)
  };
  const thirdPoint = {
    x: Math.round(mapBox.width * 0.86),
    y: Math.round(mapBox.height * 0.72)
  };

  await mapContainer.click({ position: firstPoint });
  await mapContainer.click({ position: secondPoint });
  await mapContainer.dblclick({ position: thirdPoint });

  await expect.poll(async () => {
    const text = (await measurementDialog.textContent()) ?? '';
    const match = text.match(/\b(\d+(?:[.,]\d+)*)\s?(mm|cm|m|km)\b/i);
    if (!match) {
      return 0;
    }

    const rawNumber = match[1].replace(/\s/g, '');
    const lastComma = rawNumber.lastIndexOf(',');
    const lastDot = rawNumber.lastIndexOf('.');
    const separatorIndex = Math.max(lastComma, lastDot);

    let normalizedNumber: string;
    if (separatorIndex >= 0) {
      const integerPart = rawNumber.slice(0, separatorIndex).replace(/[.,]/g, '');
      const fractionPart = rawNumber.slice(separatorIndex + 1).replace(/[.,]/g, '');
      normalizedNumber = `${integerPart}.${fractionPart}`;
    } else {
      normalizedNumber = rawNumber.replace(/[.,]/g, '');
    }

    const numericValue = Number(normalizedNumber);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    const unit = match[2].toLowerCase();
    if (unit === 'km') {
      return numericValue * 1000;
    }
    if (unit === 'cm') {
      return numericValue / 100;
    }
    if (unit === 'mm') {
      return numericValue / 1000;
    }
    return numericValue;
  }).toBeGreaterThan(0);
});
