// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher is visible by default.
  // We need to find the UV-Index layer toggle.
  // Based on the UI map, there is no specific test id for individual layer toggles.
  // We look for the layer switcher panel and then find the UV-Index entry.
  // The layer switcher panel is usually a list of checkboxes.
  // We look for a checkbox labeled "UV-Index".
  const layerSwitcherPanel = page.getByRole('panel', { name: /layer/i, exact: false });
  // Fallback: if name matching is ambiguous, try to find the panel by test id if available, 
  // but the UI map doesn't give a specific test id for the panel itself, only 'layer-switcher' as a panel.
  // Let's use the layer-switcher test id if possible, or the role.
  // The UI map says 'layer-switcher' is a panel.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Find the checkbox for UV-Index.
  // Chakra UI renders checkboxes with the input visually hidden.
  // We use getByRole('checkbox', { name: 'UV-Index' }) to find the hidden input.
  // However, accessible names might be ambiguous. Let's scope it to the layer switcher.
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Click the checkbox to enable the layer.
  // Chakra UI checkbox requires force: true because the decorative control intercepts pointer events.
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Wait for the layer to be rendered on the map.
  // Using the helper function isLayerRendered with expect.poll.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
