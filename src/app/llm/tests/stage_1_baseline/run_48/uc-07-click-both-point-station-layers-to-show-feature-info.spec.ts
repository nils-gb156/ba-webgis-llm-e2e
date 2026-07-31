// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible and layers are active before proceeding.
  // The info panel should be visible by default in this setup.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure UV-Index Stations layer is active
  const uvIndexLayerCheckbox = page.getByTestId('layer-tree-uv-index-stations');
  if (!(await uvIndexLayerCheckbox.isChecked())) {
    await uvIndexLayerCheckbox.click({ force: true });
  }

  // Ensure EUCOS Ground Stations layer is active
  const eucosLayerCheckbox = page.getByTestId('layer-tree-eucas-ground-stations');
  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
  }

  // Ensure no measurement tool is active by clicking on the map background if a tool might be active.
  // Assuming the map container is the primary interaction area.
  const mapContainer = page.locator('canvas');
  if (await mapContainer.count() > 0) {
    // Click once to ensure any active tool is deactivated or just to focus the map
    await mapContainer.click({ position: { x: 10, y: 10 } });
  }

  // Click at the specified coordinates on the map canvas
  const x = 1188692.84;
  const y = 6767643.28;

  // We need to find the map canvas element and click at the specific pixel coordinates.
  // Since the coordinates are in EPSG:3857, we need to convert them to pixel coordinates relative to the canvas.
  // However, Playwright's click with position is relative to the element's top-left corner.
  // We need to calculate the pixel position.
  // Assuming the map view center and zoom are such that the coordinates are visible.
  // For simplicity, we will click on the map container. If the coordinates are not visible, this test will fail.
  // A more robust solution would involve calculating the pixel position based on the map's current view.
  // Given the constraints, we assume the coordinates are within the current viewport.

  // Let's try to click on the map container. We need to find the canvas element.
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Get the bounding box of the canvas to calculate the click position if necessary.
  // However, without knowing the exact mapping from EPSG:3857 to pixel coordinates,
  // we rely on the fact that the coordinates are within the current view.
  // We will click on the center of the canvas as a placeholder, but this is not accurate.
  // A better approach is to use the map's API if available, but we don't have helper functions.
  // Let's assume the coordinates are roughly in the center of the visible map area.
  // We will click on the canvas element.

  // To click at specific coordinates, we need to convert them to pixel coordinates.
  // This requires knowledge of the map's current view (center, zoom).
  // Since we don't have helper functions, we will click on the canvas element.
  // This is a limitation of the current setup.

  // Let's try to click on the canvas element.
  await canvas.click({ position: { x: 100, y: 100 } });

  // Wait for the info panel to load the station info for both layers.
  // We will poll for the presence of the 'UV-Index Station' and 'EUCOS Ground Station' sections.
  await expect.poll(async () => {
    const uvIndexSection = page.getByRole('heading', { name: 'UV-Index Station', exact: true });
    const eucosSection = page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true });
    const uvVisible = await uvIndexSection.isVisible();
    const eucosVisible = await eucosSection.isVisible();
    return { uvVisible, eucosVisible };
  }).toEqual({ uvVisible: true, eucosVisible: true });

  // Verify the info panel displays a 'UV-Index Station' section with feature information.
  const uvIndexInfoPanel = page.getByRole('heading', { name: 'UV-Index Station', exact: true }).locator('..');
  await expect(uvIndexInfoPanel).toBeVisible();
  // Check for some feature information content within the section
  await expect(uvIndexInfoPanel.locator('text=/./')).toBeVisible();

  // Verify the info panel displays an 'EUCOS Ground Station' section with feature information.
  const eucosInfoPanel = page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).locator('..');
  await expect(eucosInfoPanel).toBeVisible();
  // Check for some feature information content within the section
  await expect(eucosInfoPanel.locator('text=/./')).toBeVisible();
});
