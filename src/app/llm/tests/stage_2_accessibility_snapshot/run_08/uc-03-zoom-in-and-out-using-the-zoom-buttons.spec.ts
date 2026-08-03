// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const readScaleDenominator = async (): Promise<number | undefined> => {
    const text = await scaleViewer.textContent();
    const matches = text?.match(/\d[\d.,]*/g);
    const lastMatch = matches?.at(-1);
    if (!lastMatch) {
      return undefined;
    }

    const denominator = Number(lastMatch.replace(/[^\d]/g, ''));
    return Number.isNaN(denominator) ? undefined : denominator;
  };

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const initialScale = await expect
    .poll(async () => await readScaleDenominator())
    .toBeGreaterThan(0)
    .then(() => readScaleDenominator());

  if (initialScale === undefined) {
    throw new Error('Initial scale denominator could not be determined.');
  }

  await zoomInButton.click();

  const zoomedInScale = await expect
    .poll(async () => await readScaleDenominator())
    .toBeLessThan(initialScale)
    .then(() => readScaleDenominator());

  if (zoomedInScale === undefined) {
    throw new Error('Zoomed-in scale denominator could not be determined.');
  }

  await zoomOutButton.click();

  await expect.poll(async () => await readScaleDenominator()).toBeGreaterThan(zoomedInScale);
});
