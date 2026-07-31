// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // Assuming the Precipitation layer has a test-id for its toggle or container
  const precipitationToggle = page.getByTestId('layer-toggle-precipitation');
  await expect(precipitationToggle).toBeVisible();
  
  // The layer is initially hidden, so we click to enable it.
  // Using force: true as per Chakra UI checkbox/switch handling conventions if needed,
  // but typically a toggle button or checkbox input is the target.
  // We assume a standard interaction here. If it's a Chakra checkbox, we might need force.
  // Let's assume a generic toggle button or checkbox for now.
  // Based on "Precipitation overlay layer toggle", we target the specific control.
  
  // Let's try to find the checkbox/switch for "Precipitation"
  // If a specific testid exists for the toggle, use it. Otherwise, use role/text.
  // Prompt implies test ids are available where set. Let's assume 'layer-toggle-precipitation' is the testid for the interactive element.
  
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
  // We look for a legend entry that contains the text "Precipitation"
  const legend = page.getByTestId('legend');
  const precipitationLegendEntry = legend.getByText('Precipitation', { exact: true });
  
  // Wait for the legend entry to appear as the layer is activated
  await expect(precipitationLegendEntry).toBeVisible();
});
