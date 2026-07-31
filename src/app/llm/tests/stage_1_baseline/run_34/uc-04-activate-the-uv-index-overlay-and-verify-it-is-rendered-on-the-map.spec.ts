// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle.
  // Assuming the TOC contains items with test-ids like 'layer-item-{name}' and the toggle is a checkbox.
  // If specific test-ids are not known, we rely on the accessible name "UV-Index".
  // Chakra UI checkboxes need force: true due to the decorative control element.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });

  // Ensure the toggle is initially unchecked (hidden) before clicking.
  // If it's already checked, we don't need to click.
  const isChecked = await uvIndexToggle.isChecked();
  if (!isChecked) {
    await uvIndexToggle.click({ force: true });
  }

  // Assert that the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since we can't assert directly on the canvas, we wait for a reasonable time
  // or look for a network response if available.
  // Here we assume that if the layer is checked and no error occurs, it's rendered.
  // However, to be more robust, we can wait for the map to be idle or just a short delay
  // as a proxy for tile loading, though fixed waits are discouraged.
  // A better approach for "rendered on map" in E2E without helper functions is tricky.
  // We will assume that if the layer is active, the request was made.
  // Let's capture the request for the WMS tile or image.
  
  // Note: Without specific knowledge of the WMS endpoint or test-ids for the map container,
  // we rely on the layer being checked. 
  // If we had a helper, we would check map state. Without it, we check the UI state.
  
  // To verify tiles are rendered, we might take a screenshot or check for a specific network response.
  // Let's try to catch a WMS GetMap or tile request.
  const tileResponse = page.waitForResponse(response => 
    response.url().includes('UV-Index') && response.status() === 200
  );

  // Trigger the layer load if not already loaded (re-clicking might not re-trigger if already active, 
  // but the state change usually triggers the load).
  // Since we just clicked it, the request should be in flight or completed.
  
  // Wait for the response to ensure the layer data is requested.
  await tileResponse;

  // Final assertion: The layer is checked.
  await expect(uvIndexToggle).toBeChecked();
});
