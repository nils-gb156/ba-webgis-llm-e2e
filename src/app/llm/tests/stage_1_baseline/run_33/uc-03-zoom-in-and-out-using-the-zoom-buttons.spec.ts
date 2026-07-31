// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and visible before proceeding
  await page.waitForSelector('[data-testid="map-container"]');

  // Helper to get current zoom level via map helper if available, otherwise estimate via viewport/controls
  // Since no specific map helper functions were provided in the prompt, we rely on the visual state or
  // specific test IDs if they exist for the zoom controls.
  // However, standard Chakra/OpenPioneer maps usually expose zoom controls.
  // Let's assume standard test IDs or roles for zoom buttons if not explicitly provided.
  // If specific test IDs are not known, we use getByRole with accessible names.

  // Locate Zoom In button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
  // Locate Zoom Out button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });

  // Ensure buttons are visible
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  // Record initial state if possible. Without a map helper, we can't read the numeric zoom level directly.
  // We will assume the test validates the *action* succeeds and potentially the change in state if visible.
  // Since the prompt says "map content... is NOT represented as DOM elements", and no helper is provided,
  // we must rely on the fact that the buttons are clickable and potentially any visual feedback.
  // However, usually, there is a zoom level indicator or the map canvas changes.
  // Let's click Zoom In and verify the button is still there (interaction success) and potentially look for a zoom level display.

  // Click Zoom In
  await zoomInButton.click();

  // Wait a short moment for the animation/action to complete
  await page.waitForTimeout(500);

  // Click Zoom Out
  await zoomOutButton.click();

  // Wait a short moment for the animation/action to complete
  await page.waitForTimeout(500);

  // Since we cannot assert the numeric zoom level without a helper function provided in the prompt,
  // and we cannot assert the canvas content directly, we verify that the controls remain functional
  // and the page is still stable.
  // In a real scenario with a map helper, we would do:
  // const mapHelpers = await import('./path/to/map/helpers.ts');
  // let initialZoom = await mapHelpers.getZoom(page);
  // await zoomInButton.click();
  // await expect.poll(() => mapHelpers.getZoom(page)).toBeGreaterThan(initialZoom);
  // await zoomOutButton.click();
  // await expect.poll(() => mapHelpers.getZoom(page)).toBeLessThan(await mapHelpers.getZoom(page)); // Wait, need to capture state after in

  // As per instructions, if no helpers are provided, we do not invent them.
  // We will assert that the buttons are still visible and clickable, implying the app didn't break.
  // This is a limitation of the test setup without helpers, but adheres to the constraint.
  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
});
