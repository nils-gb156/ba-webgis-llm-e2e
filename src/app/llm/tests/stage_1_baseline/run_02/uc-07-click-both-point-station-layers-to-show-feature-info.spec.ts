// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const map = page.locator('.ol-viewport').first();
  await expect(map).toBeVisible();

  const countVisibleExactText = async (text: string) => {
    return await page.getByText(text, { exact: true }).evaluateAll((elements) => {
      return elements.filter((element) => {
        const html = element as HTMLElement;
        const style = window.getComputedStyle(html);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          html.getAttribute('aria-hidden') !== 'true' &&
          html.getClientRects().length > 0
        );
      }).length;
    });
  };

  const getFeatureInfoResponse = page.waitForResponse((response) =>
    response.url().toLowerCase().includes('getfeatureinfo')
  );

  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map viewport has no bounding box.');
  }

  await map.click({
    position: {
      x: box.width / 2,
      y: box.height / 2
    }
  });

  await getFeatureInfoResponse;

  await expect.poll(() => countVisibleExactText('UV-Index Station')).toBeGreaterThan(0);
  await expect.poll(() => countVisibleExactText('EUCOS Ground Station')).toBeGreaterThan(0);
});
