// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  const panelAlreadyVisible =
    (await measurementDialog.isVisible()) ||
    (await measurementRegion.isVisible()) ||
    (await measurementHeading.isVisible());

  if (!panelAlreadyVisible) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  const dialogVisible = await measurementDialog.isVisible();
  const regionVisible = await measurementRegion.isVisible();

  if (dialogVisible) {
    await expect(measurementDialog).toBeVisible();
  } else if (regionVisible) {
    await expect(measurementRegion).toBeVisible();
  } else {
    await expect(measurementHeading).toBeVisible();
  }

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map canvas bounding box is unavailable.');
  }

  const lengthPattern = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;
  const initialLengthTextCount = await page.getByText(lengthPattern).count();

  await mapCanvas.click({
    position: {
      x: mapBox.width * 0.2,
      y: mapBox.height * 0.3
    }
  });
  await mapCanvas.click({
    position: {
      x: mapBox.width * 0.4,
      y: mapBox.height * 0.35
    }
  });
  await mapCanvas.click({
    position: {
      x: mapBox.width * 0.6,
      y: mapBox.height * 0.45
    }
  });
  await mapCanvas.dblclick({
    position: {
      x: mapBox.width * 0.75,
      y: mapBox.height * 0.5
    }
  });

  if (await measurementDialog.isVisible()) {
    await expect(measurementDialog.getByText(lengthPattern)).toBeVisible();
  } else if (await measurementRegion.isVisible()) {
    await expect(measurementRegion.getByText(lengthPattern)).toBeVisible();
  } else {
    await expect.poll(async () => {
      return await page.getByText(lengthPattern).count();
    }).toBeGreaterThan(initialLengthTextCount);
  }
});
