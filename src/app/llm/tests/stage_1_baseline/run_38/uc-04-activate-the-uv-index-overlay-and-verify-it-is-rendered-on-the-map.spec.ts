// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  await expect(uvIndexLabel).toBeVisible();

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).not.toBeChecked();

  const isMapTileRequest = (url: string, resourceType: string) =>
    resourceType === 'image' || /GetMap|SERVICE=WMS|WMTS|tilematrix|\/tiles\//i.test(url);

  const requestedTileUrls: string[] = [];
  page.on('request', request => {
    if (isMapTileRequest(request.url(), request.resourceType())) {
      requestedTileUrls.push(request.url());
    }
  });

  const tileResponsePromise = page.waitForResponse(response => {
    const request = response.request();
    return response.ok() && isMapTileRequest(response.url(), request.resourceType());
  });

  await uvIndexToggle.click({ force: true });

  await expect(uvIndexToggle).toBeChecked();

  const tileResponse = await tileResponsePromise;
  expect(tileResponse.ok()).toBeTruthy();

  await expect.poll(() => requestedTileUrls.length).toBeGreaterThan(0);
  await page.waitForLoadState('networkidle');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();
});
