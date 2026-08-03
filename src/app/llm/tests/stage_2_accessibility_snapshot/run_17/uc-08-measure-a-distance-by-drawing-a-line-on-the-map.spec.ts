// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const mapToolbar = page.getByTestId('map-toolbar');
  const measurementButton = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(mapToolbar).toBeVisible();
  await expect(measurementButton).toBeVisible();

  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });

  const isMeasurementPanelVisible = async (): Promise<boolean> => {
    return (
      (await measurementHeading.isVisible()) ||
      (await measurementDialog.isVisible()) ||
      (await measurementRegion.isVisible())
    );
  };

  if (!(await isMeasurementPanelVisible())) {
    const ariaPressed = await measurementButton.getAttribute('aria-pressed');
    const ariaExpanded = await measurementButton.getAttribute('aria-expanded');

    if (ariaPressed !== 'true' && ariaExpanded !== 'true') {
      await measurementButton.click();
    }
  }

  await expect
    .poll(async () => {
      if (await isMeasurementPanelVisible()) {
        return true;
      }

      const ariaPressed = await measurementButton.getAttribute('aria-pressed');
      const ariaExpanded = await measurementButton.getAttribute('aria-expanded');
      return ariaPressed === 'true' || ariaExpanded === 'true';
    })
    .toBe(true);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.round(mapBox.width * 0.42), y: Math.round(mapBox.height * 0.68) },
    { x: Math.round(mapBox.width * 0.49), y: Math.round(mapBox.height * 0.56) },
    { x: Math.round(mapBox.width * 0.56), y: Math.round(mapBox.height * 0.62) },
    { x: Math.round(mapBox.width * 0.63), y: Math.round(mapBox.height * 0.50) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  const lengthValue = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i).first();
  await expect(lengthValue).toBeVisible();
});
