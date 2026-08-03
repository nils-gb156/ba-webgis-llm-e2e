// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const map = page.getByTestId('map-container');
  const measurementButton = page.getByTestId('measurement-toggle');
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(map).toBeVisible();
  await expect(measurementButton).toBeVisible();

  const measurementPanelVisible = async () => {
    if (await measurementDialog.isVisible()) {
      return true;
    }
    if (await measurementHeading.isVisible()) {
      return true;
    }
    if ((await measurementButton.getAttribute('aria-expanded')) === 'true') {
      return true;
    }
    return (await measurementButton.getAttribute('aria-pressed')) === 'true';
  };

  if (!(await measurementPanelVisible())) {
    await measurementButton.click();
  }

  await expect.poll(measurementPanelVisible).toBe(true);

  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();

  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.round(mapBox.width * 0.62), y: Math.round(mapBox.height * 0.30) },
    { x: Math.round(mapBox.width * 0.70), y: Math.round(mapBox.height * 0.42) },
    { x: Math.round(mapBox.width * 0.80), y: Math.round(mapBox.height * 0.54) },
    { x: Math.round(mapBox.width * 0.88), y: Math.round(mapBox.height * 0.68) }
  ];

  await map.click({ position: points[0] });
  await map.click({ position: points[1] });
  await map.click({ position: points[2] });
  await map.dblclick({ position: points[3] });

  const lengthValue = page
    .getByText(/\b(?:[1-9]\d*(?:[.,]\d+)?|0[.,]\d*[1-9]\d*)\s?(?:m|km)\b/i)
    .first();

  await expect(lengthValue).toBeVisible();
});
