// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Wait for the Precipitation overlay to be present in the TOC
  // Assuming the layer has a test id or is identifiable by its label.
  // Using getByRole('checkbox') with the exact name "Precipitation" to target the toggle.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipitationToggle).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // Force click is used as Chakra UI checkboxes render hidden inputs under decorative elements
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Step 2: View the legend
  // Assuming the legend has a test id. If not, we might use getByRole('img', { name: 'Legend' }) or similar.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // This could be text, an image, or a specific container.
  // We check for the presence of "Precipitation" text within the legend container.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
