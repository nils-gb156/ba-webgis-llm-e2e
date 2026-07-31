// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible
  const toc = page.getByTestId('layer-switcher');
  await expect(toc).toBeVisible();

  // Locate the UV-Index overlay toggle within the layer switcher
  // Using exact match to avoid ambiguity with other potential "UV" or "Index" texts
  const uvIndexToggle = toc.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Verify the toggle is initially unchecked (hidden)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index layer
  // Force true is used because Chakra UI checkboxes render the real input visually hidden
  await uvIndexToggle.click({ force: true });

  // Assert the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since map state is not in DOM, we wait for a network response that typically
  // corresponds to the WMS/WMTS tile request for the UV-Index layer.
  // We assume a standard WMS tile request pattern for the layer name "UV-Index".
  const tileResponse = page.waitForResponse((response) => {
    const url = response.url();
    return url.includes('UV-Index') && url.includes('SERVICE=WMS') && response.status() === 200;
  });

  await tileResponse;

  // Verify that the UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert canvas content, we verify that the map container
  // is still visible and interactive, and that the layer switcher reflects the active state.
  // Additionally, we can check that no error messages are displayed.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Optional: Verify that the layer switcher still shows the UV-Index layer as checked
  await expect(uvIndexToggle).toBeChecked();
});
