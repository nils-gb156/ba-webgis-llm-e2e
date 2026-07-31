// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer.
  // The layer switcher is visible by default. We locate the Precipitation layer entry.
  // Assuming the layer switcher uses a consistent structure where each layer has a checkbox/testid.
  // Based on the UI map, we don't have specific testids for individual layer toggles listed explicitly
  // like "precipitation-toggle", but we have "layer-switcher". We need to find the Precipitation entry.
  // Often, these are structured with testids like `layer-switcher-entry-${index}` or similar.
  // However, the prompt says "UI Map (auto-generated)" and lists specific testids.
  // Let's look for a way to identify the Precipitation layer.
  // If specific testids for layers aren't listed, we might need to use text or role.
  // The prompt mentions "layer-switcher" is a panel.
  // Let's assume there is a testid for the layer entry or we can find it by text within the layer switcher.
  // Given the complexity note and typical patterns, let's try to find the Precipitation layer by text within the layer switcher.
  // If that fails, we might need to look closer at the UI map.
  // The UI map does NOT list specific layer entry testids.
  // However, it lists "layer-switcher" and "legend".
  // Let's assume we can find the Precipitation layer by its label text inside the layer switcher.
  
  // Locate the Precipitation layer toggle within the layer switcher.
  // We use getByRole('checkbox') or similar inside the layer switcher panel.
  // Since Chakra UI hides the real checkbox, we might need to click the control or use force.
  // But first, let's find the element associated with "Precipitation".
  
  const layerSwitcher = page.getByTestId('layer-switcher');
  // Attempt to find the Precipitation layer entry.
  // If there's a specific testid for the layer, it would be ideal.
  // Without it, we rely on the text "Precipitation" being present near the toggle.
  // Let's try to get the checkbox for Precipitation.
  
  // Note: The prompt says "Precipitation overlay layer is initially hidden".
  // We need to click its toggle.
  
  // Let's assume the layer switcher contains items with testids or we can scope by text.
  // If no specific testid for the layer item exists, we might use:
  // page.getByRole('checkbox', { name: 'Precipitation' }) scoped to layer-switcher?
  // Or maybe the layer switcher has a specific structure.
  
  // Let's try to click the Precipitation layer toggle.
  // We will look for a checkbox with the name "Precipitation" inside the layer switcher.
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation' });
  
  // It's possible the checkbox is visually hidden, so we use force: true.
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationToggle).toBeChecked();

  // Verify the layer is rendered on the map via the helper.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: View the legend and verify it displays an entry corresponding to the Precipitation layer.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();
  
  // Check if the legend contains text or an element related to "Precipitation".
  // The prompt mentions "precipitation-legend" as a data-testid in the UI Map.
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
