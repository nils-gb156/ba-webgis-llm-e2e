// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapContainer = page.getByTestId('map-container');
  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const readScaleDenominator = async (): Promise<number> => {
    const text = await scaleViewer.textContent();
    if (!text) {
      return Number.NaN;
    }

    const match = text.match(/(\d[\d.,\s]*)$/);
    if (!match) {
      return Number.NaN;
    }

    return Number(match[1].replace(/[^\d]/g, ''));
  };

  await expect(mapContainer).toBeVisible();
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();
  await expect(scaleViewer).toContainText('Current scale');

  let initialScale = Number.NaN;
  await expect
    .poll(async () => {
      initialScale = await readScaleDenominator();
      return initialScale;
    })
    .toBeGreaterThan(0);

  await zoomInButton.click();

  let zoomedInScale = Number.NaN;
  await expect
    .poll(async () => {
      zoomedInScale = await readScaleDenominator();
      return zoomedInScale;
    })
    .toBeLessThan(initialScale);

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      return await readScaleDenominator();
    })
    .toBeGreaterThan(zoomedInScale);
});
