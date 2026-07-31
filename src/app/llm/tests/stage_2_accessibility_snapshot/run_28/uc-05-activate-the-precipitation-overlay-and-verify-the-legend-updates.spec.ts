// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open to access the Precipitation checkbox
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  // The layer switcher is initially open, but we ensure it's in the correct state.
  // If it were closed, we would click it. Since it's open, we proceed.

  // Step 1: Click the visibility toggle of the Precipitation overlay layer.
  // The checkbox is "Precipitation" inside the layer switcher list.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer.
  // The legend is initially visible. We look for text indicating Precipitation in the legend.
  // Based on the context, the legend contains headings and paragraphs.
  // We expect to see "Precipitation" somewhere in the legend container.
  const legend = page.getByTestId('legend');
  
  // Wait for the legend to update with the Precipitation entry.
  // We poll for the presence of "Precipitation" text within the legend.
  await expect.poll(async () => {
    const legendContent = await legend.textContent();
    return legendContent ? legendContent.includes('Precipitation') : false;
  }).toBeTruthy();
});
