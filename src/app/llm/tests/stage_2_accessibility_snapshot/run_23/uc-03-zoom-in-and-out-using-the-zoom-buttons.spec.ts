// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Capture initial zoom level
  const initialZoom = await page.evaluate(() => {
    // @ts-ignore - OpenLayers map instance is typically available on window or via data-testid
    const map = (window as any).__openPioneerMap;
    return map ? map.getView().getZoom() : undefined;
  });

  // Step 1: Click Zoom in
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom level to increase
  await expect.poll(() => {
    return page.evaluate(() => {
      const map = (window as any).__openPioneerMap;
      return map ? map.getView().getZoom() : undefined;
    });
  }).toBeGreaterThan(initialZoom!);

  const zoomedInLevel = await page.evaluate(() => {
    const map = (window as any).__openPioneerMap;
    return map ? map.getView().getZoom() : undefined;
  });

  // Step 2: Click Zoom out
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom level to decrease below the zoomed-in level
  await expect.poll(() => {
    return page.evaluate(() => {
      const map = (window as any).__openPioneerMap;
      return map ? map.getView().getZoom() : undefined;
    });
  }).toBeLessThan(zoomedInLevel!);
});
