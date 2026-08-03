// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();
  const beforeOverlayScreenshot = await mapCanvas.screenshot();

  const uvIndexRequests: string[] = [];
  const uvIndexResponses: number[] = [];

  const isUvIndexRequest = (request: { url(): string; postData(): string | null }) => {
    const requestData = `${request.url()} ${request.postData() ?? ''}`.toLowerCase();
    return /uv[-_\s]?index|uvi/.test(requestData);
  };

  page.on('request', (request) => {
    if (isUvIndexRequest(request)) {
      uvIndexRequests.push(request.url());
    }
  });

  page.on('response', (response) => {
    if (isUvIndexRequest(response.request()) && response.ok()) {
      uvIndexResponses.push(response.status());
    }
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);
  await expect.poll(() => uvIndexResponses.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const afterOverlayScreenshot = await mapCanvas.screenshot();
    return afterOverlayScreenshot.equals(beforeOverlayScreenshot);
  }).toBe(false);
});
