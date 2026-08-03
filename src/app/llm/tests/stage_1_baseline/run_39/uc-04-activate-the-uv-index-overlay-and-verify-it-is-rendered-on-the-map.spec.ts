// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  await expect(uvIndexLabel).toBeVisible();

  let uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  if ((await uvIndexToggle.count()) === 0) {
    uvIndexToggle = page.getByRole('switch', { name: 'UV-Index', exact: true });
  }

  await expect(uvIndexToggle).toHaveCount(1);
  await expect(uvIndexToggle).not.toBeChecked();

  const isUvIndexTileRequest = (url: string) => {
    const decodedUrl = decodeURIComponent(url);
    return /uv[-_ ]?index/i.test(decodedUrl) && /(getmap|format=image|tile|tiles|bbox=|[?&]x=\d+&y=\d+&z=\d+)/i.test(decodedUrl);
  };

  const uvIndexTileRequests: string[] = [];
  page.on('request', request => {
    if (isUvIndexTileRequest(request.url())) {
      uvIndexTileRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    return isUvIndexTileRequest(response.url()) && response.ok();
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  const contentType = uvIndexTileResponse.headers()['content-type'] ?? '';
  expect(contentType).toMatch(/image\//i);

  await expect.poll(() => uvIndexTileRequests.length).toBeGreaterThan(0);

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();
});
