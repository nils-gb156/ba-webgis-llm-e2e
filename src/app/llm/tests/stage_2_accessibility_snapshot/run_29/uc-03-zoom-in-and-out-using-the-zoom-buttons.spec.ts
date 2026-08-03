// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function parseScaleDenominator(text: string | null): number | undefined {
  if (!text) {
    return undefined;
  }

  const match = text.match(/1\s*(?:to|:)\s*([\d\s.,]+)/i);
  if (!match) {
    return undefined;
  }

  const digitsOnly = match[1].replace(/[^\d]/g, '');
  const value = Number(digitsOnly);

  return Number.isFinite(value) && value > 0 ? value : undefined;
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

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
    return parseScaleDenominator(text);
  };

  await expect.poll(readScaleDenominator).toBeGreaterThan(0);
  const initialScale = (await readScaleDenominator())!;

  await zoomInButton.click();
  await expect.poll(readScaleDenominator).toBeLessThan(initialScale);
  const zoomedInScale = (await readScaleDenominator())!;

  await zoomOutButton.click();
  await expect.poll(readScaleDenominator).toBeGreaterThan(zoomedInScale);
});
