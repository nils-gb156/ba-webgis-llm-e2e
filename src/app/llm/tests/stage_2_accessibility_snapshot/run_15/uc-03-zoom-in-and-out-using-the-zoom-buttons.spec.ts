// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  await expect(mapContainer).toBeVisible();
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const getScaleDenominator = async (): Promise<number | undefined> => {
    const text = await scaleViewer.textContent();
    if (!text) {
      return undefined;
    }

    const match = text.match(/Current scale:\s*1 to\s*([0-9.,\s]+)/i);
    if (!match) {
      return undefined;
    }

    const digitsOnly = match[1].replace(/\D/g, '');
    if (!digitsOnly) {
      return undefined;
    }

    const value = Number(digitsOnly);
    return Number.isNaN(value) ? undefined : value;
  };

  let initialScale = 0;
  await expect
    .poll(async () => {
      const scale = await getScaleDenominator();
      if (scale !== undefined) {
        initialScale = scale;
      }
      return scale ?? -1;
    })
    .toBeGreaterThan(0);

  await zoomInButton.click();

  let scaleAfterZoomIn = 0;
  await expect
    .poll(async () => {
      const scale = await getScaleDenominator();
      if (scale !== undefined) {
        scaleAfterZoomIn = scale;
      }
      return scale ?? Number.POSITIVE_INFINITY;
    })
    .toBeLessThan(initialScale);

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const scale = await getScaleDenominator();
      return scale ?? -1;
    })
    .toBeGreaterThan(scaleAfterZoomIn);
});
