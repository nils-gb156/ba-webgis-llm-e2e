// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const readScaleDenominator = async (): Promise<number> => {
    const text = (await scaleViewer.innerText()).trim();
    const match = text.match(/Current scale:\s*1 to\s*([\d\s.,]+)/i);
    expect(match).not.toBeNull();
    return Number(match![1].replace(/\D/g, ''));
  };

  await expect(mapContainer).toBeVisible();
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  await expect.poll(readScaleDenominator).toBeGreaterThan(0);
  const initialScale = await readScaleDenominator();

  await zoomInButton.click();

  await expect.poll(readScaleDenominator).toBeLessThan(initialScale);
  const zoomedInScale = await readScaleDenominator();

  await zoomOutButton.click();

  await expect.poll(readScaleDenominator).toBeGreaterThan(zoomedInScale);
});
