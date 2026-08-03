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
    const text = (await scaleViewer.textContent()) ?? '';
    const match =
      text.match(/1\s*to\s*([\d\s.,]+)/i) ??
      text.match(/(\d[\d\s.,]*)\s*$/);

    if (!match) {
      return undefined;
    }

    const digits = match[1].replace(/[^\d]/g, '');
    return digits ? Number(digits) : undefined;
  };

  await expect.poll(readScaleDenominator).toBeGreaterThan(0);
  const initialScale = await readScaleDenominator();
  if (initialScale === undefined) {
    throw new Error('Could not read the initial map scale.');
  }

  await zoomInButton.click();

  await expect.poll(readScaleDenominator).toBeLessThan(initialScale);
  const zoomedInScale = await readScaleDenominator();
  if (zoomedInScale === undefined) {
    throw new Error('Could not read the map scale after zooming in.');
  }
  await expect(scaleViewer).toContainText('1');

  await zoomOutButton.click();

  await expect.poll(readScaleDenominator).toBeGreaterThan(zoomedInScale);
  const zoomedOutScale = await readScaleDenominator();
  if (zoomedOutScale === undefined) {
    throw new Error('Could not read the map scale after zooming out.');
  }

  expect(zoomedInScale).toBeLessThan(initialScale);
  expect(zoomedOutScale).toBeGreaterThan(zoomedInScale);
});
