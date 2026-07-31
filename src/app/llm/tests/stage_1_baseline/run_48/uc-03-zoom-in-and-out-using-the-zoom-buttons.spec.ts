// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the zoom controls to be visible
  const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  // Get initial zoom level using the helper function
  // Assuming the helper is provided in the prompt context as mapHelpers
  // We must import it statically if provided. Since the prompt says "if the prompt provides map model helper functions",
  // and no specific helper path was given in the prompt text above, I must check if I should assume one.
  // However, standard practice for this skill is that if helpers are mentioned in the "Map state via helper functions" section,
  // they are provided in the prompt. The prompt above DOES NOT provide specific helper functions or paths.
  // Therefore, I cannot use helper functions.
  // I must rely on DOM assertions or other visible indicators.
  // Wait, the prompt says "The map is rendered with OpenLayers onto an HTML <canvas>... Map content ... is NOT represented as DOM elements".
  // Without helper functions, I cannot assert on the zoom level directly if it's not in the DOM.
  // Let me re-read carefully.
  // "Map state via helper functions (only if provided in the prompt)"
  // The prompt provided does NOT provide helper functions.
  // This creates a conflict: I need to assert zoom level changes, but the zoom level is not in the DOM, and no helpers are provided.
  // In such cases, usually, there might be a zoom level indicator in the UI (a number displayed).
  // Let's look for a zoom level display.
  // If there is no zoom level display and no helpers, I cannot strictly assert the numeric zoom level.
  // However, often there is a label or a tooltip that shows the current zoom.
  // Let's assume there is a visible zoom level indicator, or I can check the map canvas size/position which is hard.
  // Actually, let's look at the "Preconditions": "The zoom in and zoom out buttons are visible on the map."
  // If I cannot assert the zoom level, the test is incomplete.
  // But wait, often in these apps, there is a zoom slider or a number display.
  // If I can't find it, I might have to skip the assertion or assume the buttons work.
  // But the expected result is explicit: "map zoom level is higher/lower".
  // Let's check if there's a common pattern. Often `data-testid="zoom-level"` or similar.
  // Since I don't have the DOM structure, I have to guess or use generic locators.
  // Let's try to find an element that displays the zoom level.
  // If I can't find it, I will assume the test relies on the side effect of the map rendering or just click the buttons.
  // But the instruction says "Derive the assertions from the expected_result field".
  // If I can't assert, I fail the requirement.
  // Let's assume there is a zoom level display with a test id or accessible name.
  // Common test id: `zoom-level`.
  // Let's try `page.getByTestId('zoom-level')`.

  const zoomLevelDisplay = page.getByTestId('zoom-level');

  // Get initial zoom level
  const initialZoomText = await zoomLevelDisplay.textContent();
  expect(initialZoomText).toBeTruthy();
  const initialZoom = parseInt(initialZoomText!, 10);

  // Step 1: Click Zoom In
  await zoomInButton.click();

  // Wait for zoom level to update
  await expect.poll(async () => page.getByTestId('zoom-level').textContent()).toBeGreaterThan(initialZoom);

  // Get new zoom level
  const zoomedInZoomText = await page.getByTestId('zoom-level').textContent();
  const zoomedInZoom = parseInt(zoomedInZoomText!, 10);

  // Step 2: Click Zoom Out
  await zoomOutButton.click();

  // Wait for zoom level to update
  await expect.poll(async () => page.getByTestId('zoom-level').textContent()).toBeLessThan(zoomedInZoom);

  // Verify it is lower than the initial zoom or just lower than zoomed in
  // The requirement says "lower than after zooming in". It doesn't strictly say it must return to initial.
  // But typically one click out might not go below initial.
  // The assertion `toBeLessThan(zoomedInZoom)` covers "lower than after zooming in".
});
