// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the zoom controls to be visible
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  // Get initial zoom level
  // Since no map helper is provided, we rely on the scale viewer which reflects zoom
  const scaleViewer = page.getByTestId('scale-viewer');
  
  // Helper to get current scale text
  const getCurrentScale = async () => {
    const text = await scaleViewer.textContent();
    // Extract the number from "Current scale: 1 to <number>"
    const match = text?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  };

  // Wait for initial scale to be available
  let initialScale = await expect.poll(getCurrentScale).toBeDefined();

  // Step 1: Click Zoom in
  await zoomInButton.click();

  // Wait for zoom to complete and scale to update
  let zoomedInScale = await expect.poll(getCurrentScale).toBeDefined();

  // Verify zoom level is higher (scale denominator is smaller when zoomed in)
  // Note: In map scales, a smaller denominator means a "larger" scale (more zoomed in).
  // However, the use case says "zoom level is higher". Usually, zoom level 10 is higher than 5.
  // Scale 1:10000 is "larger" than 1:100000.
  // Let's check the scale values. If zoomed IN, the denominator should be SMALLER.
  expect(zoomedInScale).toBeLessThan(initialScale!);

  // Step 2: Click Zoom out
  await zoomOutButton.click();

  // Wait for zoom to complete and scale to update
  let zoomedOutScale = await expect.poll(getCurrentScale).toBeDefined();

  // Verify zoom level is lower (scale denominator is larger when zoomed out)
  expect(zoomedOutScale).toBeGreaterThan(zoomedInScale!);
});
