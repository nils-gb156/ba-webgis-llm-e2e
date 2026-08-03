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

  const readScaleDenominator = async (): Promise<number | undefined> => {
    const text = await scaleViewer.innerText();
    const numericParts = [...text.matchAll(/\d[\d.,]*/g)].map((match) => match[0]);
    const lastNumericPart = numericParts.at(-1);

    if (!lastNumericPart) {
      return undefined;
    }

    const digitsOnly = lastNumericPart.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      return undefined;
    }

    return Number.parseInt(digitsOnly, 10);
  };

  let initialScale: number | undefined;
  await expect
    .poll(async () => {
      initialScale = await readScaleDenominator();
      return initialScale ?? 0;
    })
    .toBeGreaterThan(0);

  await zoomInButton.click();

  let zoomedInScale: number | undefined;
  await expect
    .poll(async () => {
      zoomedInScale = await readScaleDenominator();
      return zoomedInScale ?? Number.MAX_SAFE_INTEGER;
    })
    .toBeLessThan(initialScale!);

  await zoomOutButton.click();

  let zoomedOutScale: number | undefined;
  await expect
    .poll(async () => {
      zoomedOutScale = await readScaleDenominator();
      return zoomedOutScale ?? 0;
    })
    .toBeGreaterThan(zoomedInScale!);
});
