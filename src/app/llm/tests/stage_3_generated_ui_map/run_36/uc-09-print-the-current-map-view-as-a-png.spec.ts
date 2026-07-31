// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and have content
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  // Verify preconditions: at least one base map and one overlay layer are visible
  const activeBaseLayer = await expect.poll(() => getActiveBaseLayerTitle(page));
  expect(activeBaseLayer).toBeDefined();

  const temperatureRendered = await expect.poll(() => isLayerRendered(page, 'Temperature'));
  expect(temperatureRendered).toBe(true);

  // Step 1: Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  const printingPanel = page.getByTestId('printing-panel');

  // Ensure the printing panel is closed before clicking (in case it's already open)
  const isPrintingPanelVisible = await printingPanel.isVisible().catch(() => false);
  if (isPrintingPanelVisible) {
    await printToggle.click({ force: true });
    await expect(printingPanel).toBeHidden();
  }

  // Click the print toggle to open the panel
  await printToggle.click({ force: true });
  await expect(printingPanel).toBeVisible();

  // Step 2: Enter a title for the printout
  // Assuming there is an input for the title within the printing panel.
  // Since no specific test id for the title input is in the UI map, we look for a label or role.
  // Common patterns: label "Title", or an input inside the printing-panel.
  // We will try to find an input by label or placeholder.
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('My Map Printout');

  // Step 3: Select the PNG file format
  // Assuming a radio group or select for format. Looking for "PNG".
  const formatSelectOrRadio = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' }).first();
  // If radio doesn't exist, try select
  const formatSelect = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i });
  
  if (await formatSelect.isVisible().catch(() => false)) {
    await formatSelect.selectOption({ label: 'PNG' });
  } else if (await formatSelectOrRadio.isVisible().catch(() => false)) {
    await formatSelectOrRadio.click({ force: true });
  } else {
    // Fallback: try to find any checkbox or radio with PNG in the name
    const pngOption = page.getByTestId('printing-panel').getByRole('checkbox', { name: 'PNG' }).first();
    if (await pngOption.isVisible().catch(() => false)) {
      await pngOption.check();
    } else {
      // Last resort: assume the first selectable option in the printing panel is the format if not found
      // This is a weak assumption but necessary if UI map is incomplete.
      // However, based on typical Chakra UI, it might be a RadioGroup.
      // Let's try clicking a button or option that says PNG.
      const pngButton = page.getByTestId('printing-panel').getByText('PNG', { exact: true }).first();
      if (await pngButton.isVisible().catch(() => false)) {
        await pngButton.click();
      } else {
        throw new Error('Could not locate PNG format selector');
      }
    }
  }

  // Step 4: Click the export/print button
  const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print/i }).first();
  await expect(exportButton).toBeVisible();

  // Wait for download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click()
  ]);

  // Assert on the download
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
