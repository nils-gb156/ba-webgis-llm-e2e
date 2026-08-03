// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  let uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  if ((await uvIndexToggle.count()) === 0) {
    uvIndexToggle = page.getByRole('switch', { name: 'UV-Index', exact: true });
  }

  await expect(uvIndexToggle).toBeVisible();
  await expect(uvIndexToggle).not.toBeChecked();

  const canvases = page.locator('canvas');
  await expect(canvases.first()).toBeVisible();

  const beforeCanvasCount = await canvases.count();
  expect(beforeCanvasCount).toBeGreaterThan(0);

  const beforeCanvasScreenshots: Buffer[] = [];
  for (let i = 0; i < beforeCanvasCount; i++) {
    beforeCanvasScreenshots.push(await canvases.nth(i).screenshot());
  }

  const requestedImageUrls: string[] = [];
  let capturePostToggleRequests = false;

  page.on('request', request => {
    if (
      capturePostToggleRequests &&
      request.resourceType() === 'image' &&
      !request.url().startsWith('data:')
    ) {
      requestedImageUrls.push(request.url());
    }
  });

  capturePostToggleRequests = true;
  const tileResponsePromise = page.waitForResponse(response => {
    return (
      capturePostToggleRequests &&
      response.request().resourceType() === 'image' &&
      !response.url().startsWith('data:') &&
      requestedImageUrls.includes(response.url()) &&
      response.ok()
    );
  });

  await uvIndexToggle.click({ force: true });
  await expect(uvIndexToggle).toBeChecked();

  await expect.poll(() => requestedImageUrls.length > 0).toBe(true);
  await tileResponsePromise;
  capturePostToggleRequests = false;

  await expect
    .poll(async () => {
      const afterCanvasCount = await canvases.count();
      if (afterCanvasCount !== beforeCanvasCount) {
        return true;
      }

      for (let i = 0; i < afterCanvasCount; i++) {
        const afterScreenshot = await canvases.nth(i).screenshot();
        if (!beforeCanvasScreenshots[i].equals(afterScreenshot)) {
          return true;
        }
      }

      return false;
    })
    .toBe(true);
});
