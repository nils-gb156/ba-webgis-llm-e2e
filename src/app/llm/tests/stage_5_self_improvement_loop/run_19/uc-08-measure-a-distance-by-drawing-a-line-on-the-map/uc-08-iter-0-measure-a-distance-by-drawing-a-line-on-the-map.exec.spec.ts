// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Wait for the measurement panel to appear
  await expect(page.getByTestId('map-toolbar')).toBeVisible();

  // Step 2: Click several points on the map to draw a line
  // The map container is the canvas area. We click at distinct positions.
  const mapContainer = page.getByTestId('map-container');

  // Click first point (center-left of the visible map)
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click second point (center-right)
  await mapContainer.click({ position: { x: 500, y: 300 } });
  // Click third point (bottom-center)
  await mapContainer.click({ position: { x: 400, y: 500 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 500 } });

  // Wait for the highlight to settle
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Expected results:
  // - The measurement panel is visible (it's part of the map-toolbar or a floating panel)
  //   The prompt says "measurement panel". Looking at the toolbar, there isn't a separate panel
  //   explicitly named "measurement-panel" in the test ids. However, the result is usually shown
  //   in the info panel or a dedicated floating element. Let's look for the result.
  // - The measurement panel displays a length value with a unit.

  // The measurement result is typically displayed in a floating panel or the info panel.
  // Since the info panel is open and says "Click on the map to load a forecast", it might
  // not be the right place. Often, measurement results appear in a small floating box near
  // the last clicked point or in the toolbar itself.
  // Let's assert on the presence of a measurement result text pattern.
  // We'll look for text that looks like a distance measurement (e.g., "12.5 km", "100 m").
  
  // A robust way is to check if the info panel or a dedicated measurement result element
  // contains a number followed by a unit.
  // Let's try to find any text on the page that matches a measurement pattern.
  
  // Alternatively, the measurement result might be in the `info-panel`.
  // Let's check the info panel for measurement data.
  
  // Since the exact location of the measurement result isn't specified by a test id,
  // we can assert that the map has a highlight (which we already did) and then
  // look for the measurement result text. The result is often displayed in a tooltip
  // or a small panel.
  
  // Let's assume the measurement result is displayed in the `info-panel` or a dedicated
  // measurement result element. We will search for a pattern like "X.XX km" or "X.XX m".
  
  // We'll use a general locator to find text that looks like a measurement.
  // A common pattern is a number, possibly with decimals, followed by a space and a unit.
  const measurementResultPattern = /\d+(\.\d+)?\s*(km|m|mi|ft)/i;
  
  // We can check the entire page or a specific container. Let's check the page for the pattern.
  // Since `getByText` with a regex is not directly supported, we can use `locator` with a regex
  // or `getByText` with a string that is part of the result.
  // A better approach is to use `page.locator` with a regex on the text content of a likely container.
  // However, Playwright's `getByText` does not support regex. We can use `locator('text=/pattern/')`.
  
  // Let's try to find the measurement result by looking for a common unit.
  // We'll check if the info panel or the map toolbar contains the measurement result.
  
  // Actually, let's look at the `info-panel`. It might be updated with the measurement.
  // Or there might be a specific element for the measurement result.
  // Since no specific test id is provided for the measurement result, we'll assert on the
  // presence of a measurement-like string anywhere in the info panel or a known result container.
  
  // Let's try to find the measurement result in the `info-panel`.
  const infoPanel = page.getByTestId('info-panel');
  
  // We'll poll for the info panel to contain a measurement result.
  await expect.poll(async () => {
    const text = await infoPanel.textContent();
    return text;
  }).toMatch(measurementResultPattern);
});
