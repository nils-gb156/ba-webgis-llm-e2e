// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and layers to be rendered
  await expect.poll(() => page.locator('#map-container').isVisible()).toBe(true);
  await expect.poll(() => page.locator('#scale-bar').isVisible()).toBe(true);

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  const titleInput = page.getByLabel('Title'); // Assuming a label exists, or use getByTestId if available
  // Since no specific test id for title input is in the UI map, we rely on label or placeholder.
  // If no label, we might need to find an input inside the printing panel.
  // Let's assume there's an accessible name or we can scope it.
  // Looking at the UI map, there is no specific test id for the title input.
  // We will try to find an input within the printing panel.
  const printingPanel = page.getByTestId('printing-panel');
  const titleInputLocator = printingPanel.locator('input[type="text"]').first();
  await titleInputLocator.fill('Test Printout');

  // Step 3: The user selects the PNG file format.
  // Assuming there is a radio group or select for format.
  // We need to find the PNG option.
  const pngOption = printingPanel.getByRole('radio', { name: 'PNG' }).or(printingPanel.getByRole('option', { name: 'PNG' })).or(printingPanel.getByText('PNG'));
  // If it's a radio button, it might be hidden by Chakra UI.
  // Let's try clicking the radio button with force if it's a Chakra control.
  // We need to determine the exact role. Let's assume it's a radio group for simplicity or a select.
  // Given the complexity, let's look for a button or radio that says PNG.
  const pngSelector = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
  const isRadioVisible = await pngSelector.isVisible().catch(() => false);
  if (isRadioVisible) {
    await pngSelector.click({ force: true });
  } else {
    // Fallback: maybe it's a select
    const select = printingPanel.locator('select').first();
    if (await select.isVisible().catch(() => false)) {
      await select.selectOption('PNG');
    } else {
      // Fallback: maybe it's a button group
      const pngButton = printingPanel.getByRole('button', { name: 'PNG', exact: true });
      if (await pngButton.isVisible().catch(() => false)) {
        await pngButton.click();
      } else {
        // Last resort: find any text PNG and click its parent button/radio
        const pngText = printingPanel.getByText('PNG', { exact: true });
        await pngText.click();
      }
    }
  }

  // Step 4: The user clicks the export/print button.
  // Wait for download before clicking
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printingPanel.getByRole('button', { name: /Export|Print|Download/i }).first().click()
  ]);

  // Expected result: A PNG file containing the current map view is generated and downloaded.
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/);
});
