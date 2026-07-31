// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and visible
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get the current zoom level via the scale viewer text
  // The scale viewer shows "Current scale: 1 to X". A smaller X means higher zoom.
  // However, zoom level is often a distinct number. Let's look at the scale viewer.
  // If zoom level isn't directly exposed, we can infer it from the scale or use a helper if provided.
  // Since no helper is provided in the prompt, we rely on the scale viewer text or map interaction.
  // Actually, let's look at the accessibility tree. There is no explicit "zoom level" role.
  // But we can check the scale. A higher zoom means a smaller scale denominator (e.g. 1:1000 vs 1:1000000).
  // Let's extract the scale denominator.

  const getScaleDenominator = async (page: any) => {
    const scaleText = await page.getByTestId('scale-viewer').textContent();
    // Format: "Current scale: 1 to 2739072"
    const match = scaleText?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Initial scale denominator
  const initialScale = await getScaleDenominator(page);

  // Step 1: Click the 'Zoom in' button to increase the zoom level.
  // Zoom in means the scale denominator should decrease.
  await page.getByRole('button', { name: 'Zoom in map' }).click();

  // Wait for the map to update and scale to change
  await expect.poll(async () => getScaleDenominator(page)).toBeLessThan(initialScale);

  // Get the scale after zooming in
  const zoomedInScale = await getScaleDenominator(page);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level.
  // Zoom out means the scale denominator should increase.
  await page.getByRole('button', { name: 'Zoom out map' }).click();

  // Wait for the map to update and scale to change
  // The new scale should be larger than the zoomed-in scale.
  await expect.poll(async () => getScaleDenominator(page)).toBeGreaterThan(zoomedInScale);
});
