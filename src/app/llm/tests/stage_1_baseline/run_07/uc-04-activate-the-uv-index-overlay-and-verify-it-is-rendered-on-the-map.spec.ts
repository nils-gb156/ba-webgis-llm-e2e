// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  const uvIndexToggle = page.getByRole('checkbox', { name: /UV-Index/i });
  const mapViewport = page.locator('.ol-viewport');

  await expect(uvIndexLabel).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();
  await expect(mapViewport).toBeVisible();

  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // Ignore if the map keeps background requests alive.
  }

  const beforeMapImage = await mapViewport.screenshot();

  const tileRequestUrls: string[] = [];
  const tileResponseUrls: string[] = [];

  const isTileLikeUrl = (url: string) =>
    /service=wms/i.test(url) ||
    /request=getmap/i.test(url) ||
    /\/tile(s)?\//i.test(url) ||
    /\.(png|jpg|jpeg|webp)(\?|$)/i.test(url);

  page.on('request', request => {
    const url = request.url();
    if (request.resourceType() === 'image' || isTileLikeUrl(url)) {
      tileRequestUrls.push(url);
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (response.ok() && (response.request().resourceType() === 'image' || isTileLikeUrl(url))) {
      tileResponseUrls.push(url);
    }
  });

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();
  await expect.poll(() => tileRequestUrls.length, { timeout: 15000 }).toBeGreaterThan(0);
  await expect.poll(() => tileResponseUrls.length, { timeout: 15000 }).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const afterMapImage = await mapViewport.screenshot();
      return !afterMapImage.equals(beforeMapImage);
    }, { timeout: 15000 })
    .toBe(true);
});
