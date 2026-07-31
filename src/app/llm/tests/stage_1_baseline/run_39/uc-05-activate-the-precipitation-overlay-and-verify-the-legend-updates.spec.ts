// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher/legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // We assume the Precipitation layer has a test id for its toggle or we locate it by text.
  // Using getByTestId is preferred if available. If not, we might need to find the layer item first.
  // Let's assume there is a test id for the precipitation layer toggle, e.g., 'layer-toggle-precipitation'.
  // If not, we might have to rely on the text "Precipitation" within the layer switcher.
  // Given the instructions, we should try getByTestId first.
  const precipToggle = page.getByTestId('layer-toggle-precipitation');
  
  // Check current state to avoid toggling if already checked, though preconditions say it's hidden.
  // We will click with force=true as it's likely a Chakra UI checkbox/switch
  await precipToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipToggle).toBeChecked();

  // Step 2: View the legend
  // The legend should now display an entry corresponding to the Precipitation layer.
  // We expect the legend to contain text or an element related to "Precipitation".
  const legend = page.getByTestId('legend');
  
  // Assert that the legend displays an entry for the Precipitation layer.
  // This could be a specific test id or just text within the legend.
  // We'll check for the text "Precipitation" inside the legend container.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
