// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) and legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Locate the Precipitation overlay layer toggle in the TOC.
  // Assuming the TOC lists layers with checkboxes, and the Precipitation layer has a specific test id or accessible name.
  // If a specific test id for the layer item exists, use it. Otherwise, rely on the accessible name.
  // Chakra UI checkboxes need force: true.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  
  // Ensure the toggle is initially hidden (unchecked) as per preconditions, then click it.
  // We assert it is unchecked first to be safe, though preconditions state it is hidden.
  await expect(precipitationToggle).not.toBeChecked();

  // Click the toggle with force: true because Chakra UI renders the input visually hidden
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // Assuming the legend component updates its content. We look for text related to "Precipitation" in the legend.
  const legend = page.getByTestId('legend');
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
