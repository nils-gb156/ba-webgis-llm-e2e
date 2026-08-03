// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanel).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const width = mapBox!.width;
  const height = mapBox!.height;

  await mapContainer.click({
    position: {
      x: Math.round(width * 0.45),
      y: Math.round(height * 0.35),
    },
  });
  await mapContainer.click({
    position: {
      x: Math.round(width * 0.55),
      y: Math.round(height * 0.45),
    },
  });
  await mapContainer.dblclick({
    position: {
      x: Math.round(width * 0.65),
      y: Math.round(height * 0.55),
    },
  });

  await expect.poll(async () => (await measurementPanel.textContent()) ?? '').toMatch(
    /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|yd|mi|nm)\b/i
  );
});
