// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // The UV-Index overlay is initially hidden. We need to find its toggle in the layer switcher.
  // Based on the UI map, the layer switcher panel is visible by default.
  // We look for the UV-Index layer entry. Since exact text matching might be ambiguous,
  // we scope to the layer switcher panel if possible, or rely on the specific role.
  // The UI map doesn't explicitly list layer item test ids, so we use getByRole with exact name.
  // Assuming the layer switcher has a role or container we can scope to, or we search within it.
  // Let's assume the layer switcher panel has a test id or accessible name.
  // If not, we might need to find the checkbox by its label "UV-Index".
  
  // Looking at the UI map, there is no specific test id for layer items.
  // We will use getByRole('checkbox', { name: 'UV-Index' }) scoped to the layer switcher if it has one.
  // If the layer switcher panel doesn't have a clear role, we might need to find the checkbox globally.
  // However, strict mode might fail if there are multiple "UV-Index" labels.
  // Let's try to find the layer switcher panel first.
  const layerSwitcherPanel = page.getByRole('region', { name: /Layer Switcher/i }).first();
  
  // If the above fails to find a region, we might need to look for the toggle button directly.
  // Let's try clicking the checkbox for UV-Index.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true }).first();
  
  // Wait for the checkbox to be visible (it should be in the layer switcher)
  await expect(uvIndexCheckbox).toBeVisible();

  // Click the checkbox to enable the layer
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the UV-Index layer to be rendered on the map
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
