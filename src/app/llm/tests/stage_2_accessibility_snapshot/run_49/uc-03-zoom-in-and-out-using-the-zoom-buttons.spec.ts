// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const parseScale = (text: string | null): number | undefined => {
    if (!text) {
      return undefined;
    }

    const match = text.match(/Current scale:\s*1 to\s*([\d.,]+)/i);
    if (!match) {
      return undefined;
    }

    const numericValue = Number(match[1].replace(/[^\d]/g, ''));
    return Number.isNaN(numericValue) ? undefined : numericValue;
  };

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const initialScale = await expect
    .poll(async () => parseScale(await scaleViewer.textContent()))
    .not.toBeUndefined();

  await zoomInButton.click();

  const zoomedInScale = await expect
    .poll(async () => parseScale(await scaleViewer.textContent()))
    .toBeLessThan(initialScale);

  await zoomOutButton.click();

  await expect
    .poll(async () => parseScale(await scaleViewer.textContent()))
    .toBeGreaterThan(zoomedInScale);
});
