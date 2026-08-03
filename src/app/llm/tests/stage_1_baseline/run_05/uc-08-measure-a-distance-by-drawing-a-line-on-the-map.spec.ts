// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  if (!(await measurementHeading.isVisible())) {
    await measurementButton.click();
  }
  await expect(measurementHeading).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const body = page.locator('body');
  const getLengthMatches = async (): Promise<string[]> => {
    const text = await body.innerText();
    return text.match(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/gi) ?? [];
  };

  const initialLengthMatches = JSON.stringify(await getLengthMatches());

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map canvas has no bounding box.');
  }

  const positions = [
    { x: Math.round(box.width * 0.25), y: Math.round(box.height * 0.30) },
    { x: Math.round(box.width * 0.45), y: Math.round(box.height * 0.38) },
    { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.48) },
    { x: Math.round(box.width * 0.78), y: Math.round(box.height * 0.58) }
  ];

  await mapCanvas.click({ position: positions[0] });
  await mapCanvas.click({ position: positions[1] });
  await mapCanvas.click({ position: positions[2] });
  await mapCanvas.dblclick({ position: positions[3] });

  await expect.poll(async () => JSON.stringify(await getLengthMatches())).not.toBe(initialLengthMatches);
  await expect(page.getByText(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i).first()).toBeVisible();
});
