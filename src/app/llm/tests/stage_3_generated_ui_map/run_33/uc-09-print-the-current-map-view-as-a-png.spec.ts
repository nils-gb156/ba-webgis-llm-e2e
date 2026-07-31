// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is loaded and layers are visible
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBeDefined();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the 'Print Map' button to open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  // Ensure the printing panel is closed before clicking if it's already open
  const printingPanel = page.getByTestId('printing-panel');
  const isPanelVisible = await printingPanel.isVisible();
  if (isPanelVisible) {
    await printToggle.click({ force: true });
  }
  await printToggle.click({ force: true });

  // Expected result: The printing panel is visible
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is a text input for the title inside the printing panel.
  // Based on common patterns, we look for a label or input within the panel.
  // Since specific test IDs for the title input aren't listed, we use getByLabel or getByRole within the panel.
  const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
  if (titleInput) {
    await titleInput.fill('My Map Print');
  } else {
    // Fallback: try to find any input in the panel if specific label isn't found
    const anyInput = printingPanel.getByRole('textbox');
    await anyInput.fill('My Map Print');
  }

  // Step 3: Select the PNG file format
  // Assuming radio buttons or a select for format.
  const formatSelection = printingPanel.getByRole('radio', { name: 'PNG' }).first();
  if (await formatSelection.isChecked()) {
    // Already selected
  } else {
    await formatSelection.check();
  }

  // Step 4: Click the export/print button
  const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
  
  // Prepare for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Expected result: A PNG file is generated and downloaded
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
