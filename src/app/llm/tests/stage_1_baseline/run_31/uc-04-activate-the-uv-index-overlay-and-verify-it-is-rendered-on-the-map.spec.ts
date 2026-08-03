// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const uvIndexLabel = page.getByText('UV-Index', { exact: true });
  await expect(uvIndexLabel).toBeVisible();

  const uvIndexCheckbox = page.getByRole('checkbox', { name: /UV-Index/i });
  const uvIndexSwitch = page.getByRole('switch', { name: /UV-Index/i });
  const uvIndexToggle = (await uvIndexCheckbox.count()) > 0 ? uvIndexCheckbox : uvIndexSwitch;

  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const isUvIndexRequest = (url: string) => /uv[-_]?index|uvi/i.test(url);

  const capturedUvIndexRequests: string[] = [];
  page.on('request', request => {
    if (isUvIndexRequest(request.url())) {
      capturedUvIndexRequests.push(request.url());
    }
  });

  const uvIndexTileResponsePromise = page.waitForResponse(response => {
    const url = response.url();
    const contentType = response.headers()['content-type'] ?? '';
    return (
      isUvIndexRequest(url) &&
      response.ok() &&
      (/image\//i.test(contentType) || /getmap|tile/i.test(url))
    );
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  const uvIndexTileResponse = await uvIndexTileResponsePromise;
  await expect.poll(() => capturedUvIndexRequests[0]).toMatch(/uv[-_]?index|uvi/i);
  expect(uvIndexTileResponse.ok()).toBeTruthy();
});
