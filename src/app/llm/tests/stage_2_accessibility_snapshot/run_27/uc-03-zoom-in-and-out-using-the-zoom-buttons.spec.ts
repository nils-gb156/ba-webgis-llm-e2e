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

  const getScaleDenominator = async (): Promise<number> => {
    const text = await scaleViewer.innerText();
    const matches = text.match(/\d[\d.,]*/g);
    const rawValue = matches?.at(-1);

    if (!rawValue) {
      return 0;
    }

    return Number(rawValue.replace(/[.,]/g, ''));
  };

  await expect.poll(async () => await getScaleDenominator()).toBeGreaterThan(0);
  const initialScale = await getScaleDenominator();

  await zoomInButton.click();

  await expect.poll(async () => await getScaleDenominator()).toBeLessThan(initialScale);
  const zoomedInScale = await getScaleDenominator();

  await zoomOutButton.click();

  await expect.poll(async () => await getScaleDenominator()).toBeGreaterThan(zoomedInScale);
});
