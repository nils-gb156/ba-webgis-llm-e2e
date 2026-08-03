// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');
  const scaleViewer = page.getByTestId('scale-viewer');

  const parseScaleDenominator = (text: string | null): number | undefined => {
    if (!text) {
      return undefined;
    }

    const match = text.match(/Current scale:\s*1\s*(?:to|:)\s*([0-9][0-9\s.,]*)/i);
    if (!match) {
      return undefined;
    }

    const numericPart = match[1].replace(/[^\d]/g, '');
    if (!numericPart) {
      return undefined;
    }

    return Number(numericPart);
  };

  const getScaleDenominator = async (): Promise<number | undefined> => {
    const text = await scaleViewer.textContent();
    return parseScaleDenominator(text);
  };

  await expect(mapContainer).toBeVisible();
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(scaleViewer).toBeVisible();
  await expect(scaleViewer).toContainText(/Current scale/i);

  const initialScale = await getScaleDenominator();
  expect(initialScale, 'Initial scale should be readable from the scale viewer.').toBeDefined();
  const initialScaleValue = initialScale!;

  await zoomInButton.click();

  await expect.poll(() => getScaleDenominator()).toBeLessThan(initialScaleValue);

  const zoomedInScale = await getScaleDenominator();
  expect(zoomedInScale, 'Scale after zooming in should be readable from the scale viewer.').toBeDefined();
  const zoomedInScaleValue = zoomedInScale!;
  expect(zoomedInScaleValue).toBeLessThan(initialScaleValue);

  await zoomOutButton.click();

  await expect.poll(() => getScaleDenominator()).toBeGreaterThan(zoomedInScaleValue);
});
