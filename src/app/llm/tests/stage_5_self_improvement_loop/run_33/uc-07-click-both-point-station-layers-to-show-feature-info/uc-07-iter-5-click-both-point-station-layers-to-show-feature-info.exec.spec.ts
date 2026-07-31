// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  // The map canvas is the topmost element inside map-container; clicking it directly
  // avoids the "intercepts pointer events" problem caused by sibling DOM elements.
  await page.locator('#map-container canvas').click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.
  // Use expect.poll to retry until the info panel content has settled.
  await expect.poll(() =>
    page.getByTestId('info-panel').textContent(),
  ).toContain('UV-Index Station');
  await expect.poll(() =>
    page.getByTestId('info-panel').textContent(),
  ).toContain('EUCOS Ground Station');
});
