// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await mapContainer.click({ position: { x: 400, y: 400 } });
  await mapContainer.click({ position: { x: 500, y: 350 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 500, y: 350 } });

  // Expected results:
  // The measurement panel is visible (already asserted above)
  // The measurement panel displays a length value with a unit
  // The panel is identified by data-testid 'measurement-panel'.
  // The result text typically looks like "Length: 123.45 m" or similar.
  // We assert that the panel contains text matching a length pattern.
  await expect.poll(() =>
    page.getByTestId('measurement-panel').getByText(/Length:.*m/).first().textContent()
  ).toMatch(/Length:.*m/);
});
