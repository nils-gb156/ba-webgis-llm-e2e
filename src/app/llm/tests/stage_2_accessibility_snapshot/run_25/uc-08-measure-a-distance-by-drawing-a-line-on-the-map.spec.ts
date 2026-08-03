// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementButton = page.getByTestId('measurement-toggle');

  const isMeasurementPanelVisible = async (): Promise<boolean> => {
    const measurementDialog = page.getByRole('dialog', { name: /measure/i });
    if ((await measurementDialog.count()) > 0) {
      return await measurementDialog.isVisible();
    }

    const measurementHeading = page.getByRole('heading', { name: /measure/i });
    if ((await measurementHeading.count()) > 0) {
      return await measurementHeading.isVisible();
    }

    return false;
  };

  await expect(mapContainer).toBeVisible();
  await expect(measurementButton).toBeVisible();

  if (!(await isMeasurementPanelVisible())) {
    await measurementButton.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const firstPoint = {
    x: Math.round(mapBox.width * 0.45),
    y: Math.round(mapBox.height * 0.40)
  };
  const secondPoint = {
    x: Math.round(mapBox.width * 0.58),
    y: Math.round(mapBox.height * 0.48)
  };
  const thirdPoint = {
    x: Math.round(mapBox.width * 0.70),
    y: Math.round(mapBox.height * 0.56)
  };

  await mapContainer.click({ position: firstPoint });
  await mapContainer.click({ position: secondPoint });
  await mapContainer.dblclick({ position: thirdPoint });

  await expect.poll(async () => {
    const measurementTexts = await page
      .getByText(/\d[\d.,]*\s?(?:mm|cm|m|km)\b/i)
      .allTextContents();

    return measurementTexts.some((text) => {
      const match = text.match(/(\d[\d.,]*)\s?(mm|cm|m|km)\b/i);
      if (!match) {
        return false;
      }

      const numericValue = Number.parseFloat(
        match[1]
          .replace(/\.(?=\d{3}\b)/g, '')
          .replace(',', '.')
      );

      return Number.isFinite(numericValue) && numericValue > 0;
    });
  }).toBe(true);
});
