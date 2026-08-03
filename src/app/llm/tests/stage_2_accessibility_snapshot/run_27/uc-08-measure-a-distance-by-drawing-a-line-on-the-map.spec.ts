// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  if (!(await measurementHeading.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementHeading).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.35),
      y: Math.round(box.height * 0.35)
    }
  });
  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.5),
      y: Math.round(box.height * 0.45)
    }
  });
  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.65),
      y: Math.round(box.height * 0.55)
    }
  });
  await mapContainer.dblclick({
    position: {
      x: Math.round(box.width * 0.78),
      y: Math.round(box.height * 0.62)
    }
  });

  const measurementValue = page.getByText(
    /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|meter|meters|kilometer|kilometers)\b/i
  ).first();

  await expect(measurementValue).toBeVisible();
});
