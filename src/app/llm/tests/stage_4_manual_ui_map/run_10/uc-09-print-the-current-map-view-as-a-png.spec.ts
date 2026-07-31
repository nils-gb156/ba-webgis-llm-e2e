// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
  const printToggle = page.getByTestId('print-toggle');
  await printToggle.click();

  // Verify the printing panel is visible
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // Step 2: The user enters a title for the printout.
  // Assuming the printing panel contains an input for the title.
  // Since no specific test id for the title input is given in the UI map, we look inside the printing-panel.
  // Often these are labeled "Title" or similar. If no label, we might need to find an input.
  // Let's assume there is a label or test id. If not, we might need to guess based on common patterns.
  // However, the prompt says "enter a title". Let's look for an input inside the printing panel.
  // If no specific locator is provided, we might have to rely on accessible names.
  // Let's assume there is a label "Title" or similar.
  // If we can't find a specific test id, we try getByRole('textbox', { name: /title/i })
  const titleInput = page.getByTestId('printing-panel').getByRole('textbox', { name: /title/i });
  if (titleInput.count() === 0) {
      // Fallback: maybe it's just an input without a clear label, or labeled "Print Title"
      // Let's try a broader search if the specific one fails, but usually getByRole is robust.
      // If the UI map doesn't specify inputs inside printing-panel, we might need to be creative.
      // But wait, the UI map says:
      // {
      //     "data-testid": "printing-panel",
      //     "visibleByDefault": false,
      //     "note": "Draggable floating panel (position: fixed)",
      //     "toggledBy": { "action": "click", "target": "print-toggle" },
      //     "elements": [
      //         { "data-testid": "printing", "visibleByDefault": false }
      //     ]
      // }
      // It doesn't list the internal elements like title input.
      // This is a problem. We need to know what's inside.
      // However, the use case says "enters a title".
      // Let's assume standard Chakra UI components might have test ids or we can use labels.
      // If no test id is available, we fall back to getByRole.
      // Let's try to find an input field.
      const inputs = page.getByTestId('printing-panel').locator('input');
      if (await inputs.count() > 0) {
          // If there's only one input, it's likely the title.
          await inputs.first().fill('Test Print Title');
      } else {
          // If no input found, we might have to skip or assume it's not testable without more info.
          // But let's assume there is a label "Title"
          await page.getByTestId('printing-panel').getByLabel('Title').fill('Test Print Title');
      }
  } else {
      await titleInput.fill('Test Print Title');
  }

  // Step 3: The user selects the PNG file format.
  // Look for a radio button or dropdown for format.
  // Assuming a radio group or dropdown.
  // Let's look for a radio button with name "PNG" or similar.
  const pngOption = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' });
  if (await pngOption.count() > 0) {
      await pngOption.click();
  } else {
      // Maybe it's a dropdown
      const formatDropdown = page.getByTestId('printing-panel').getByRole('combobox', { name: /format/i });
      if (await formatDropdown.count() > 0) {
          await formatDropdown.click();
          await page.getByRole('option', { name: 'PNG' }).click();
      } else {
          // Fallback to any checkbox or radio for PNG
          const pngCheckbox = page.getByTestId('printing-panel').getByRole('checkbox', { name: 'PNG' });
          if (await pngCheckbox.count() > 0) {
              await pngCheckbox.click();
          }
      }
  }

  // Step 4: The user clicks the export/print button.
  // Look for a button with text "Print" or "Export" or "Download"
  const printButton = page.getByTestId('printing-panel').getByRole('button', { name: /print|export|download/i });
  
  // Wait for download to start
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    printButton.click()
  ]);

  // Verify the download
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
