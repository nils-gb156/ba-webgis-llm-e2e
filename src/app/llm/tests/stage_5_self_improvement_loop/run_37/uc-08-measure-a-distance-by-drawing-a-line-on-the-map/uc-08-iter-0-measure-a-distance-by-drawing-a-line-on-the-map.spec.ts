// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // Step 1: Click the Measurement button to open the measurement panel
  await page.getByRole('button', { name: 'Measurement' }).click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // Get the initial center to click around it for drawing the line
  const center = await getMapCenter(page);
  expect(center).toBeDefined();

  // Step 2: Click several points on the map canvas to draw a line
  // We will click 3 points to form a simple line segment
  const mapContainer = page.getByTestId('map-container');

  // Calculate click positions relative to the map container
  // Point 1: slightly up-left from center
  const point1 = { x: Math.floor(center![0] - 50), y: Math.floor(center![1] - 50) };
  // Point 2: slightly down-right from center
  const point2 = { x: Math.floor(center![0] + 50), y: Math.floor(center![1] + 50) };
  // Point 3: further down-right
  const point3 = { x: Math.floor(center![0] + 100), y: Math.floor(center![1] + 100) };

  // Click the first point
  await mapContainer.click({ position: { x: point1.x, y: point1.y } });

  // Click the second point
  await mapContainer.click({ position: { x: point2.x, y: point2.y } });

  // Click the third point
  await mapContainer.click({ position: { x: point3.x, y: point3.y } });

  // Step 3: Double-click to finish the measurement
  // Playwright's click({ clickCount: 2 }) is the standard way to simulate a double-click
  await mapContainer.click({ position: { x: point3.x, y: point3.y }, clickCount: 2 });

  // Expected results:
  // 1. The measurement panel is visible (already checked, but let's ensure it's still there)
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // 2. The measurement panel displays a length value with a unit.
  // The result is typically displayed in the map-controls-panel or a dedicated measurement result area.
  // Based on common UI patterns, it might be a text element inside the panel.
  // We'll look for text that matches a number followed by a unit like "m", "km", "mi", etc.
  // Since we don't have a specific test id for the result, we'll check the panel's text content.
  const measurementPanel = page.getByTestId('map-controls-panel');
  
  // Wait for the measurement result to appear. It might take a moment for the calculation to complete.
  await expect.poll(async () => {
    const text = await measurementPanel.textContent();
    return text;
  }).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft|in|cm|mm|nm|yd)/i);
});
