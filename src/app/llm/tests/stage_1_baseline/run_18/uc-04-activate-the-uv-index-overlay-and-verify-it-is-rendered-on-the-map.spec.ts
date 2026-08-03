// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  const mapCanvas = page.locator('canvas').first();

  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();
  await expect(mapCanvas).toBeVisible();

  await page.waitForLoadState('networkidle');

  const beforeToggleScreenshot = await mapCanvas.screenshot();

  const tileRequestsAfterToggle: string[] = [];
  const successfulTileResponsesAfterToggle: string[] = [];

  page.on('request', (request) => {
    const url = request.url().toLowerCase();
    const isTileLikeRequest =
      request.resourceType() === 'image' ||
      url.includes('service=wms') ||
      url.includes('service=wmts') ||
      url.includes('/tile') ||
      url.includes('/tiles');

    if (isTileLikeRequest) {
      tileRequestsAfterToggle.push(request.url());
    }
  });

  page.on('response', (response) => {
    const url = response.url().toLowerCase();
    const contentType = response.headers()['content-type'] ?? '';
    const isTileLikeResponse =
      response.request().resourceType() === 'image' ||
      url.includes('service=wms') ||
      url.includes('service=wmts') ||
      url.includes('/tile') ||
      url.includes('/tiles') ||
      contentType.startsWith('image/');

    if (isTileLikeResponse && response.ok()) {
      successfulTileResponsesAfterToggle.push(response.url());
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => tileRequestsAfterToggle.length).toBeGreaterThan(0);
  await expect.poll(() => successfulTileResponsesAfterToggle.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const afterToggleScreenshot = await mapCanvas.screenshot();
    return afterToggleScreenshot.equals(beforeToggleScreenshot);
  }).toBe(false);
});
