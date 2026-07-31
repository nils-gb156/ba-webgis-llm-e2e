// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // The UV-Index layer is initially hidden. We need to find its toggle in the layer switcher.
  // Based on the UI map, we have a layer-switcher panel. The specific toggle for "UV-Index"
  // is not explicitly listed with a test id in the provided summary, but typically these
  // are checkboxes or buttons within the layer switcher.
  // Looking at the layers list: UV-Index is an operational layer.
  // We will look for a checkbox or button with the name "UV-Index" inside the layer switcher.
  
  const layerSwitcher = page.getByRole('panel', { name: /layer/i, exact: false }).first();
  // Try to find the toggle. It might be a checkbox or a button.
  // Since we don't have a specific test id for the UV-Index toggle, we use getByRole with exact name.
  // Note: Chakra UI checkboxes render the input visually hidden. We must use force: true.
  
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true })
    .or(page.getByRole('button', { name: 'UV-Index', exact: true }));

  // If the toggle exists, click it.
  if (await uvIndexToggle.isVisible()) {
    await uvIndexToggle.click({ force: true });
  } else {
    // Fallback: if specific role-based lookup fails, try finding it by text in the layer switcher
    // This is less robust but handles cases where the role might be generic.
    const uvIndexItem = layerSwitcher.getByText('UV-Index', { exact: true }).first();
    if (await uvIndexItem.isVisible()) {
      // Try clicking the parent container or a specific control within it
      // Often these are buttons or divs with click handlers
      await uvIndexItem.click();
    }
  }

  // Wait for the layer to be rendered on the map
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Assert that the UV-Index overlay layer toggle is in the enabled (checked) state
  // We re-find the toggle to assert its state
  const uvIndexToggleState = page.getByRole('checkbox', { name: 'UV-Index', exact: true })
    .or(page.getByRole('button', { name: 'UV-Index', exact: true }));
  
  // If it's a checkbox, check if it's checked. If it's a button, we might check for an "active" state or aria-pressed.
  // Assuming it's a checkbox based on typical layer switcher implementations:
  await expect(page.getByRole('checkbox', { name: 'UV-Index', exact: true })).toBeChecked();
});
