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

  const readScaleDenominator = async (): Promise<number> => {
    const text = await scaleViewer.innerText();
    const denominatorText = text.match(/(\d[\d.,\s]*)(?!.*\d)/)?.[1];

    if (!denominatorText) {
      throw new Error(`Could not parse scale denominator from: "${text}"`);
    }

    return Number(denominatorText.replace(/[^\d]/g, ''));
  };

  await expect.poll(async () => await readScaleDenominator()).toBeGreaterThan(0);
  const initialScale = await readScaleDenominator();

  await zoomInButton.click();

  await expect.poll(async () => await readScaleDenominator()).toBeLessThan(initialScale);
  const zoomedInScale = await readScaleDenominator();

  await zoomOutButton.click();

  await expect.poll(async () => await readScaleDenominator()).toBeGreaterThan(zoomedInScale);
});
