// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const readScaleDenominator = async (): Promise<number | undefined> => {
    const text = await scaleViewer.textContent();
    if (!text) {
      return undefined;
    }

    const numericParts = text.match(/\d[\d.,\s]*/g);
    if (!numericParts || numericParts.length === 0) {
      return undefined;
    }

    const denominator = Number(numericParts[numericParts.length - 1].replace(/[^\d]/g, ''));
    return Number.isFinite(denominator) && denominator > 0 ? denominator : undefined;
  };

  await expect(mapContainer).toBeVisible();
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  let initialScale: number | undefined;
  await expect.poll(async () => {
    initialScale = await readScaleDenominator();
    return initialScale ?? 0;
  }).toBeGreaterThan(0);

  if (initialScale === undefined) {
    throw new Error('Initial map scale could not be determined.');
  }

  await zoomInButton.click();

  let zoomedInScale: number | undefined;
  await expect.poll(async () => {
    zoomedInScale = await readScaleDenominator();
    return zoomedInScale ?? Number.MAX_SAFE_INTEGER;
  }).toBeLessThan(initialScale);

  if (zoomedInScale === undefined) {
    throw new Error('Scale after zooming in could not be determined.');
  }

  await zoomOutButton.click();

  let zoomedOutScale: number | undefined;
  await expect.poll(async () => {
    zoomedOutScale = await readScaleDenominator();
    return zoomedOutScale ?? 0;
  }).toBeGreaterThan(zoomedInScale);

  if (zoomedOutScale === undefined) {
    throw new Error('Scale after zooming out could not be determined.');
  }
});
