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

  const readScale = async (): Promise<number | undefined> => {
    const text = await scaleViewer.textContent();
    if (!text) {
      return undefined;
    }

    const match = text.match(/1\s*to\s*([\d.,]+)/i);
    if (!match) {
      return undefined;
    }

    const numericValue = Number(match[1].replace(/[^\d]/g, ''));
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
  };

  let initialScale = 0;
  await expect
    .poll(async () => {
      const scale = await readScale();
      if (scale !== undefined) {
        initialScale = scale;
      }
      return scale ?? 0;
    })
    .toBeGreaterThan(0);

  await zoomInButton.click();

  let zoomedInScale = 0;
  await expect
    .poll(async () => {
      const scale = await readScale();
      if (scale !== undefined) {
        zoomedInScale = scale;
      }
      return scale ?? Number.POSITIVE_INFINITY;
    })
    .toBeLessThan(initialScale);

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const scale = await readScale();
      return scale ?? 0;
    })
    .toBeGreaterThan(zoomedInScale);
});
