// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be ready
  // We assume the map container has a testid or role. If not, we wait for a known UI element.
  // Based on typical Open Pioneer apps, we wait for the map canvas or a specific panel.
  // Let's wait for the info panel to be visible as a precondition, implying app is loaded.
  // However, we need to ensure layers are active. The prompt says preconditions include layers being active.
  // In an E2E test, we usually have to set up the state if it's not default.
  // But the prompt says "Preconditions: ... UV-Index Stations layer (WMS) is active ... EUCOS Ground Stations layer (WFS) is active".
  // If these are not active by default, we might need to activate them.
  // Let's assume for this "hard" complexity test that we need to verify the state or that the app starts in this state.
  // Given the specific coordinates and "preconditions", it's likely the test assumes the layers are toggled on.
  // If the layers are not toggled on by default, the test would fail to find features.
  // Let's try to find the layer tree or layer controls if necessary.
  // However, without specific test IDs for the layer toggles, we might rely on the fact that the prompt implies they are active.
  // Let's proceed with clicking the map and checking the result. If the info panel doesn't show both, we might need to toggle layers.
  // But the prompt says "Preconditions: ... is active". This suggests we don't need to toggle them.
  
  // Wait for the map to be interactable. We'll look for the map canvas or a container.
  // Open Pioneer maps often have a specific testid or we can use the canvas.
  await page.waitForSelector('canvas', { timeout: 30000 });

  // Get the map container to click on specific coordinates.
  // We need to find the map element. Often it's a div with a specific class or testid.
  // Let's try to find the map by role or a common testid if known.
  // If no testid, we might use a selector for the map container.
  // Let's assume the map container has a testid 'map-container' or similar.
  // If not, we can try to find the canvas and get its bounding box.
  
  const mapLocator = page.locator('canvas').first();
  await expect(mapLocator).toBeVisible({ timeout: 30000 });

  // Coordinates: [1188692.84, 6767643.28] (EPSG:3857)
  const x = 1188692.84;
  const y = 6767643.28;

  // We need to click at these coordinates on the map.
  // Playwright's click with position is relative to the element.
  // We need to convert EPSG:3857 to pixel coordinates on the map canvas.
  // This is tricky without map helper functions.
  // However, the prompt provides "map state via helper functions (only if provided in the prompt)".
  // No helpers are provided in the prompt.
  // This is a problem. How do we click at specific EPSG:3857 coordinates without a helper?
  // Usually, E2E tests for maps use known pixel offsets if the map view is fixed, or they use a helper.
  // Since no helper is provided, and the complexity is "hard", maybe we need to calculate it?
  // Or maybe the prompt implies that we should use a helper if available, but since it's not, we must assume the test can't do this precisely?
  // Wait, looking at similar tasks, often the map is centered on a specific view and the coordinates correspond to a known pixel location.
  // But without knowing the zoom level and center, we can't calculate pixels.
  // Let's re-read the prompt. "If the prompt provides map model helper functions...". It does not.
  // Is there another way? Maybe the coordinates are provided in pixels? No, it says EPSG:3857.
  // Maybe the test is expected to fail or use a different approach?
  // Or maybe I should assume the map is in a default state where these coordinates map to the center of the viewport?
  // Let's assume the map is centered such that these coordinates are near the center, or we can click the center.
  // But "hard" complexity suggests precision is needed.
  // Let's look at the "Preconditions" again. "Both a UVI station and an EUCOS ground station are located at map coordinates...".
  // If I can't click exactly there, I might miss the features.
  // However, in many E2E tests for this project, there might be a way to get the map center or use a helper.
  // Since I cannot invent helpers, I will try to click the center of the map and hope the features are there, or use a known testid if available.
  // But the prompt is specific about coordinates.
  // Let's check if there's a common pattern. Often, `page.mouse.move` and `page.mouse.click` are used.
  // We need the bounding box of the map.
  
  const box = await mapLocator.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found or not visible');
  }

  // Without map helpers, we cannot convert EPSG:3857 to pixel coordinates accurately.
  // However, for the sake of generating the test code as requested, and assuming the environment is set up such that
  // the map is centered on these coordinates or they are easily accessible, we might need to make an assumption.
  // A common approach in such constrained E2E tests without helpers is that the coordinates provided correspond to the center of the map viewport.
  // Let's assume the map is centered on [1188692.84, 6767643.28].
  // Then we click the center of the map canvas.
  
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Click at the center of the map
  await page.mouse.click(centerX, centerY);

  // Wait for the info panel to update.
  // The info panel should show feature info for both layers.
  // We need to identify the info panel. It might have a testid like 'info-panel'.
  // Let's try to find the info panel by role or text.
  // The expected results are 'UV-Index Station' and 'EUCOS Ground Station'.
  
  // Wait for the info panel to be visible
  const infoPanel = page.getByRole('region', { name: /info/i }).first();
  // Or maybe a specific testid. Let's try getByTestId if we can guess it, but we can't.
  // Let's try to find elements with the text 'UV-Index Station' and 'EUCOS Ground Station'.
  
  // We need to wait for the info panel to load the station info.
  // This might take some time due to network requests.
  
  // Check for UV-Index Station info
  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible({ timeout: 30000 });
  
  // Check for EUCOS Ground Station info
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible({ timeout: 30000 });

  // Additionally, we can check that the info panel itself is visible and contains these sections.
  // The info panel might be a specific element. Let's try to find it by a common testid or role.
  // If 'info-panel' testid exists:
  // await expect(page.getByTestId('info-panel')).toBeVisible();
  
  // Since we don't know the exact testid for the info panel, we rely on the text assertions.
  // The assertions above are sufficient to verify the expected results.
});
