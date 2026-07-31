// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: info panel is visible and measurement tool is inactive
  await expect(page.getByTestId('info-panel')).toBeVisible();
  // Measurement-toggle is a Chakra toggle button with role="button" and aria-pressed, not a checkbox.
  // Assert that it is not in the pressed state.
  await expect(page.getByTestId('measurement-toggle')).not.toBeAttached({ ariaPressed: 'true' });

  // Click the map at the specified coordinates
  const clickX = 1188692.84;
  const clickY = 6767643.28;
  await page.getByTestId('map-container').click({ position: { x: clickX, y: clickY } });

  // Wait for the info panel to load feature info for both layers
  await expect.poll(() => page.getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBe(true);
  await expect.poll(() => page.getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBe(true);

  // Verify that a highlight marker appeared at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([clickX, clickY]);
});
