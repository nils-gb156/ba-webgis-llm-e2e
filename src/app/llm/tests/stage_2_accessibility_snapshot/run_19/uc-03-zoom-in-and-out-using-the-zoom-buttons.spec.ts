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

  const getScaleDenominator = async (): Promise<number> => {
    const text = await scaleViewer.textContent();
    if (!text) {
      throw new Error('Scale viewer has no text content.');
    }

    const normalizedText = text.replace(/\u00a0/g, ' ').trim();
    const numbers = normalizedText.match(/\d[\d.,]*/g);
    if (!numbers || numbers.length === 0) {
      throw new Error(`Could not parse scale from text: "${normalizedText}"`);
    }

    const denominator = Number(numbers[numbers.length - 1].replace(/[^\d]/g, ''));
    if (!Number.isFinite(denominator) || denominator <= 0) {
      throw new Error(`Parsed invalid scale denominator from text: "${normalizedText}"`);
    }

    return denominator;
  };

  await expect.poll(async () => await getScaleDenominator()).toBeGreaterThan(0);
  const initialScale = await getScaleDenominator();

  await zoomInButton.click();
  await expect.poll(async () => await getScaleDenominator()).toBeLessThan(initialScale);
  const zoomedInScale = await getScaleDenominator();

  await zoomOutButton.click();
  await expect.poll(async () => await getScaleDenominator()).toBeGreaterThan(zoomedInScale);
});
