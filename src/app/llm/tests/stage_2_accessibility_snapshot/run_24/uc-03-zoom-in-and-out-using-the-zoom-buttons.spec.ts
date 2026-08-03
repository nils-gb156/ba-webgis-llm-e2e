// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const readScaleDenominator = async (): Promise<number> => {
    const text = (await scaleViewer.innerText()).trim();
    const matches = text.match(/\d[\d.,\s]*/g);

    if (!matches || matches.length === 0) {
      throw new Error(`Could not parse scale from text: "${text}"`);
    }

    const lastMatch = matches[matches.length - 1];
    const digitsOnly = lastMatch.replace(/\D/g, '');

    if (!digitsOnly) {
      throw new Error(`Could not extract scale denominator from text: "${text}"`);
    }

    return Number.parseInt(digitsOnly, 10);
  };

  await expect.poll(async () => await readScaleDenominator()).toBeGreaterThan(0);
  const initialScale = await readScaleDenominator();

  let scaleAfterZoomIn = initialScale;
  await zoomInButton.click();
  await expect.poll(async () => {
    scaleAfterZoomIn = await readScaleDenominator();
    return scaleAfterZoomIn;
  }).toBeLessThan(initialScale);

  let scaleAfterZoomOut = scaleAfterZoomIn;
  await zoomOutButton.click();
  await expect.poll(async () => {
    scaleAfterZoomOut = await readScaleDenominator();
    return scaleAfterZoomOut;
  }).toBeGreaterThan(scaleAfterZoomIn);
});
