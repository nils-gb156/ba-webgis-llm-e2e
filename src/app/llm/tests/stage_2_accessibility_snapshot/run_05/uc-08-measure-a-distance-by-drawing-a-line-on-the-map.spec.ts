// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const mapContainer = page.getByTestId('map-container');

  await expect(measurementButton).toBeVisible();
  await expect(mapContainer).toBeVisible();

  const measurementPanel = page
    .getByRole('dialog', { name: /measurement/i })
    .or(page.getByRole('region', { name: /measurement/i }))
    .or(page.getByRole('heading', { name: /^Measurement$/i }))
    .or(page.getByText(/(?:Length|Distance)/i));

  if (!(await measurementPanel.first().isVisible())) {
    await measurementButton.click();
  }

  await expect(measurementPanel.first()).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: { x: Math.round(box.width * 0.3), y: Math.round(box.height * 0.35) }
  });
  await mapContainer.click({
    position: { x: Math.round(box.width * 0.5), y: Math.round(box.height * 0.45) }
  });
  await mapContainer.click({
    position: { x: Math.round(box.width * 0.65), y: Math.round(box.height * 0.55) }
  });
  await mapContainer.dblclick({
    position: { x: Math.round(box.width * 0.78), y: Math.round(box.height * 0.62) }
  });

  const lengthValue = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i).first();
  await expect(lengthValue).toBeVisible();
});
