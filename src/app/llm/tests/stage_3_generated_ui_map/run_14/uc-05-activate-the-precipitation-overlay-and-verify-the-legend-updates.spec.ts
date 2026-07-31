// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is visible by default. We need to find the Precipitation layer item.
  // Based on the UI map, there isn't a specific test id for individual layer items in the TOC listed,
  // but typically these are structured. Let's look for the layer switcher panel and then the specific layer.
  // Since no specific test ID for the layer item is provided in the "Components" table,
  // we might need to use getByRole or getByText within the layer-switcher panel.
  // However, the prompt says "Prefer getByTestId whenever a test id is available".
  // Let's re-read the UI Map. It lists "layer-switcher" as a panel. It does not list individual layer items.
  // But wait, the UI map is auto-generated. Let's assume there might be a test id or we use accessible names.
  // The prompt says: "Fall back to user-facing properties... only for elements without a test id."
  // Let's try to find the layer switcher and then the precipitation layer.
  
  // The layer switcher is visible by default.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Locate the Precipitation layer toggle.
  // Often these are buttons or checkboxes. Let's look for "Precipitation" text.
  // Since "Precipitation" might be a label or part of a button, we'll use getByRole('checkbox') or 'button' with name.
  // Given Chakra UI, it's likely a checkbox or a toggle button.
  // Let's assume it's a checkbox or button with the name "Precipitation".
  // We need to scope it to the layer switcher to avoid ambiguity if "Precipitation" appears elsewhere.
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation' });
  
  // If it's not a checkbox, it might be a button. Let's try checkbox first as it's a visibility toggle.
  // If the element is not found, we might need to adjust. But let's assume standard accessibility.
  // The prompt mentions Chakra UI form controls. Let's use force: true if it's a Chakra checkbox.
  
  // Check if it's already checked (it shouldn't be, per preconditions)
  const isPrecipitationVisible = await isLayerRendered(page, 'Precipitation');
  
  if (!isPrecipitationVisible) {
    // Click the toggle to enable it
    // Using force: true because Chakra UI overlays a decorative element
    await precipitationToggle.click({ force: true });
  }

  // Verify the Precipitation overlay is rendered
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: View the legend
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We look for "Precipitation" or "precipitation-legend" in the legend area.
  // The UI map lists "precipitation-legend" as an element.
  const precipitationLegend = page.getByTestId('precipitation-legend');
  await expect(precipitationLegend).toBeVisible();
});
