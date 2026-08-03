// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const parseScaleDenominator = (text: string): number => {
    const matches = [...text.matchAll(/\d[\d.,\s]*/g)].map((match) => match[0].replace(/\D/g, ''));
    const lastNumber = matches.at(-1);
    return lastNumber ? Number.parseInt(lastNumber, 10) : Number.NaN;
  };

  const getScaleDenominator = async (): Promise<number> => {
    const text = (await scaleViewer.innerText()).trim();
    return parseScaleDenominator(text);
  };

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  await expect.poll(async () => await getScaleDenominator()).toBeGreaterThan(0);
  const initialScale = await getScaleDenominator();

  let zoomedInScale = initialScale;
  await zoomInButton.click();
  await expect.poll(async () => {
    zoomedInScale = await getScaleDenominator();
    return zoomedInScale;
  }).toBeLessThan(initialScale);

  let zoomedOutScale = zoomedInScale;
  await zoomOutButton.click();
  await expect.poll(async () => {
    zoomedOutScale = await getScaleDenominator();
    return zoomedOutScale;
  }).toBeGreaterThan(zoomedInScale);
});
