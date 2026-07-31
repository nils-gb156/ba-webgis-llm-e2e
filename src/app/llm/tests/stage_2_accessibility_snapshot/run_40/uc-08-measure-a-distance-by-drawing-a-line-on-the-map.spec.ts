// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is loaded and ready
  await expect(page.locator('#map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to click on the map container. We'll pick some arbitrary coordinates.
  // The map container is identified by data-testid "map-container"
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point (center-ish)
  await mapContainer.click({ position: { x: 400, y: 300 } });
  
  // Click second point
  await mapContainer.click({ position: { x: 500, y: 300 } });
  
  // Click third point
  await mapContainer.click({ position: { x: 500, y: 400 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 500, y: 400 } });

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.
  
  // The measurement panel is likely part of the info-panel or a specific measurement result area.
  // Based on the context, the info-panel is already open and pressed.
  // The measurement result might be displayed in the info-panel or a dedicated measurement section.
  // Let's check for the info-panel visibility first.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Look for a measurement result. It might contain text like "Distance:" or a number with "m" or "km".
  // Since we don't have a specific test id for the measurement result, we'll look for text in the info panel.
  // We'll poll for the presence of a length value with a unit.
  await expect.poll(() => infoPanel.getByText(/(\d+(\.\d+)?\s*(m|km|mi|ft))/)).toBeVisible();
});
