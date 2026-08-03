// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  if (!(await measurementPanelHeading.isVisible())) {
    const pressed = await measurementToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementToggle.click();
    }
  }

  await expect(measurementPanelHeading).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const point = (xFactor: number, yFactor: number) => ({
    x: Math.round((mapBox?.width ?? 0) * xFactor),
    y: Math.round((mapBox?.height ?? 0) * yFactor)
  });

  await mapContainer.click({ position: point(0.5, 0.35) });
  await mapContainer.click({ position: point(0.58, 0.45) });
  await mapContainer.dblclick({ position: point(0.66, 0.4) });

  await expect(
    page.getByText(/\b\d+(?:[.,]\d+)?\s*(?:m|km|meters?|kilometers?)\b/i).first()
  ).toBeVisible();
});
