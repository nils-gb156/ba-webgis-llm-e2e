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
    const match = text.match(/1\s+to\s+([\d.,\s]+)/i);

    if (!match) {
      return undefined;
    }

    const denominator = Number(match[1].replace(/[^\d]/g, ''));
    return Number.isNaN(denominator) ? undefined : denominator;
  };

  let initialScaleDenominator: number | undefined;
  await expect
    .poll(async () => {
      initialScaleDenominator = await readScaleDenominator();
      return initialScaleDenominator;
    })
    .toBeGreaterThan(0);

  if (initialScaleDenominator === undefined) {
    throw new Error('Could not determine the initial map scale.');
  }

  await zoomInButton.click();

  let scaleAfterZoomIn: number | undefined;
  await expect
    .poll(async () => {
      scaleAfterZoomIn = await readScaleDenominator();
      return scaleAfterZoomIn;
    })
    .toBeLessThan(initialScaleDenominator);

  if (scaleAfterZoomIn === undefined) {
    throw new Error('Could not determine the map scale after zooming in.');
  }

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      return await readScaleDenominator();
    })
    .toBeGreaterThan(scaleAfterZoomIn);
});
