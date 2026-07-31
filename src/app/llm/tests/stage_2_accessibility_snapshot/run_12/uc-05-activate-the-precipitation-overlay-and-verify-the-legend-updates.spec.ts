// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open and visible
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherToggle).toBeVisible();
  
  // The accessibility tree shows Layer Switcher [pressed], so it is already open.
  // If it were closed, we would click it. Here we assume it's open based on the context.
  // However, to be robust, we can check if the layer switcher content is visible.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer.
  // The accessibility tree shows: checkbox "Precipitation" [unchecked]
  // We need to click this checkbox. Since it's a Chakra UI checkbox, we use force: true.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).toBeChecked({ checked: false });
  
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend.
  // The legend should be visible as per preconditions.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We poll the legend content to ensure it has updated with the new layer.
  // We look for text that likely indicates precipitation in the legend.
  // Common legend texts for precipitation might be "Precipitation" or specific units like "mm".
  // Let's assert that the legend contains an entry with "Precipitation" in its heading or text.
  await expect.poll(() => legend.locator('h1, h2, h3, p, span').allTextContents()).toContain(
    expect.stringMatching(/Precipitation/i)
  );
});
