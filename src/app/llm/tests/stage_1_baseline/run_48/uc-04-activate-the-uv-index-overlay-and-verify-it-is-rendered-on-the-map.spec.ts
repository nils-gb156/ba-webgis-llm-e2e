// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the initial map and TOC to load
  await expect(page.getByTestId('toc')).toBeVisible();

  // Locate the UV-Index layer toggle in the TOC.
  // Assuming the TOC uses checkboxes for layer visibility.
  // We scope the search to the TOC container to avoid ambiguity.
  const toc = page.getByTestId('toc');
  const uvIndexToggle = toc.getByRole('checkbox', { name: 'UV-Index' });

  // Ensure the layer is initially hidden (unchecked) as per preconditions
  await expect(uvIndexToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle to show the layer
  await uvIndexToggle.click({ force: true });

  // Step 2: Wait for the layer to be requested and rendered
  // We assert that the checkbox is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Verify the layer is rendered on the map canvas.
  // Since the map is a canvas, we check for the presence of a specific tile
  // or the general state of the map canvas being active.
  // A common way to verify a specific WMS layer is rendered is to check
  // if the map canvas exists and potentially has content, or wait for a network request.
  // Here we wait for the map canvas to be visible and assume the layer is part of it.
  // To be more specific, we could wait for the network request to the WMS endpoint.
  
  // Let's wait for a WMS GetMap request for the UV-Index layer.
  const wmsResponse = page.waitForResponse(response => {
    const url = response.url();
    return url.includes('SERVICE=WMS') && 
           url.includes('LAYERS=UV-Index') && 
           response.status() === 200;
  });

  // Trigger the action again if needed, but the click should have triggered it.
  // Sometimes the click is immediate, but the request might be slightly delayed.
  // We already clicked, so we just wait for the response.
  await wmsResponse;

  // Finally, assert that the map canvas is visible and has some content
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();
});
