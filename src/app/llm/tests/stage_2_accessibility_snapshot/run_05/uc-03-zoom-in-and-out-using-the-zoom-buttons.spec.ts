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
  await expect(scaleViewer).toContainText(/Current scale:/);

  const readScaleDenominator = async (): Promise<number> => {
    const text = await scaleViewer.innerText();
    const match = text.match(/Current scale:\s*1\s*to\s*([0-9.,\s]+)/i);
    expect(match).not.toBeNull();

    const digits = match![1].replace(/\D/g, '');
    expect(digits).not.toBe('');

    return Number(digits);
  };

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

  await expect.poll(async () => readScaleDenominator()).toBeGreaterThan(zoomedInScale);
});
