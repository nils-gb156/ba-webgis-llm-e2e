// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  const panelVisibleBefore = await measurementHeading.isVisible().catch(() => false);
  if (!panelVisibleBefore) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementHeading).toBeVisible();

  const map = page.locator('.ol-viewport').first();
  await expect(map).toBeVisible();

  const box = await map.boundingBox();
  expect(box).not.toBeNull();

  const width = Math.round(box!.width);
  const height = Math.round(box!.height);

  await map.click({
    position: { x: Math.round(width * 0.25), y: Math.round(height * 0.35) }
  });
  await map.click({
    position: { x: Math.round(width * 0.45), y: Math.round(height * 0.40) }
  });
  await map.click({
    position: { x: Math.round(width * 0.60), y: Math.round(height * 0.55) }
  });
  await map.dblclick({
    position: { x: Math.round(width * 0.75), y: Math.round(height * 0.60) }
  });

  await expect(page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/)).toBeVisible();
});
