// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanelHeading = page.getByRole('heading', { name: /info/i }).first();
  await expect(infoPanelHeading).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  let featureInfoRequestUrl: string | undefined;
  page.on('request', request => {
    const url = request.url();
    if (/getfeatureinfo/i.test(url)) {
      featureInfoRequestUrl = url;
    }
  });

  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas is not visible.');
  }

  await mapCanvas.click({
    position: {
      x: mapBox.width / 2,
      y: mapBox.height / 2
    }
  });

  await expect.poll(() => featureInfoRequestUrl).toMatch(/getfeatureinfo/i);

  const uvIndexStationSection = page.getByText('UV-Index Station', { exact: true });
  const eucosGroundStationSection = page.getByText('EUCOS Ground Station', { exact: true });

  await expect(uvIndexStationSection).toBeVisible();
  await expect(eucosGroundStationSection).toBeVisible();
});
