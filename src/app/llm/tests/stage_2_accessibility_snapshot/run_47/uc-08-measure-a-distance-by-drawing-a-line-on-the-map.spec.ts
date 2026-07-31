// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is loaded and interactive by waiting for the map container
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button to activate the measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Step 2: Click several points on the map canvas to draw a line
  // We click at different positions to create a visible line segment
  const mapContainer = page.getByTestId('map-container');
  
  // First point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Second point
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Third point
  await mapContainer.click({ position: { x: 300, y: 100 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 300, y: 100 } });

  // Expected results:
  // 1. The measurement panel is visible.
  // 2. The measurement panel displays a length value with a unit.
  
  // The measurement result is typically shown in the info panel or a specific measurement result container.
  // Based on the context, the info panel is already open and pressed.
  // We look for text that resembles a distance measurement (e.g., "km", "m", "mi") inside the info panel or a dedicated result area.
  // Since no specific test id for the measurement result is provided, we check the info panel for a numeric value followed by a unit.
  
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Wait for the measurement result to appear. It might contain text like "1.23 km" or "1234.56 m".
  // We poll for a pattern that looks like a number followed by a common distance unit.
  await expect.poll(async () => {
    const text = await infoPanel.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(km|m|mi|ft|cm)/);
});
