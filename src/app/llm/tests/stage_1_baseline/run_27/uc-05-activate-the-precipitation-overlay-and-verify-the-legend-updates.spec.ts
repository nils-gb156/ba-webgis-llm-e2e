// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  await expect(page.getByTestId('toc')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer is initially hidden, so we click the checkbox to enable it.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).toBeChecked({ checked: false });
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
  // We check that the legend container contains text related to "Precipitation"
  const legendContainer = page.getByTestId('legend');
  await expect(legendContainer).toContainText('Precipitation');
});
