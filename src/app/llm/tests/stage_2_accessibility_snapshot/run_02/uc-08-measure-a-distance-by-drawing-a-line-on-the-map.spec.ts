// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const mapToolbar = page.getByTestId('map-toolbar');
  const measurementButton = page.getByTestId('measurement-toggle');
  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(mapToolbar).toBeVisible();
  await expect(measurementButton).toBeVisible();

  if (!(await measurementPanelHeading.isVisible())) {
    await measurementButton.click();
  }

  await expect(measurementPanelHeading).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  if (!mapBox) {
    throw new Error('Map container is not interactable.');
  }

  const points = [
    { x: Math.round(mapBox.width * 0.25), y: Math.round(mapBox.height * 0.35) },
    { x: Math.round(mapBox.width * 0.4), y: Math.round(mapBox.height * 0.48) },
    { x: Math.round(mapBox.width * 0.58), y: Math.round(mapBox.height * 0.32) },
    { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.42) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  await expect(measurementPanelHeading).toBeVisible();

  const measurementResult = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i).first();
  await expect(measurementResult).toBeVisible();
});
