// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const readScaleDenominator = async (): Promise<number> => {
    const text = await scaleViewer.textContent();
    const match = text?.match(/1\s+to\s+([0-9.,\s]+)/i);
    const value = match?.[1]?.replace(/[^\d]/g, '');
    return value ? Number(value) : Number.NaN;
  };

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  await expect.poll(readScaleDenominator).toBeGreaterThan(0);
  const initialScale = await readScaleDenominator();

  await zoomInButton.click();

  let zoomedInScale = initialScale;
  await expect
    .poll(async () => {
      zoomedInScale = await readScaleDenominator();
      return zoomedInScale;
    })
    .toBeLessThan(initialScale);

  await zoomOutButton.click();

  let zoomedOutScale = zoomedInScale;
  await expect
    .poll(async () => {
      zoomedOutScale = await readScaleDenominator();
      return zoomedOutScale;
    })
    .toBeGreaterThan(zoomedInScale);
});
