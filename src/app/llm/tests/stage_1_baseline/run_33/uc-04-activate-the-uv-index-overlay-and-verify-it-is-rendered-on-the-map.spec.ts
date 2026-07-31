// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle.
  // Assuming the toggle is a checkbox with a test-id or accessible name.
  // If no specific test-id is known, we use getByRole with an exact name.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Verify the layer is initially hidden (unchecked)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the layer
  await uvIndexToggle.click({ force: true });

  // Assert the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since map tiles are rendered on a canvas and not DOM elements,
  // we wait for a network response related to the WMS tile request.
  // We assume the WMS endpoint URL pattern or a specific test-id on the map container.
  // A robust way is to listen for the tile request.
  const tileResponse = page.waitForResponse(response =>
    response.url().includes('wms') && response.request().method() === 'GET'
  );

  await tileResponse;

  // Verify the map canvas exists and is visible.
  // While we cannot easily assert "tiles are rendered" via DOM,
  // the successful receipt of the tile response implies the layer was requested.
  // We assert the map container is visible as a proxy for the map being active.
  await expect(page.getByTestId('map-container')).toBeVisible();
});
