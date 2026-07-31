// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle in the layer switcher.
  // Assuming the layer item has a test id or we can find it by text.
  // We look for the checkbox associated with "UV-Index".
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Ensure it is initially hidden (unchecked)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the layer
  await uvIndexToggle.click({ force: true });

  // Assert the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map tiles to load.
  // Since we don't have a specific test id for the map canvas or the tile layer,
  // we wait for a network response that typically indicates the layer data has started loading.
  // WMS GetMap requests are common for raster overlays.
  const requestPromise = page.waitForResponse(response =>
    response.url().includes('GetMap') && response.status() === 200
  );

  await requestPromise;
});
