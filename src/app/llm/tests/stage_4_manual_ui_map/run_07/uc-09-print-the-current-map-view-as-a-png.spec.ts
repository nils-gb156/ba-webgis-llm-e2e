// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready and layers to render
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap !== undefined)).toBe(true);
  await expect.poll(() => page.evaluate(() => {
    const map = (globalThis as any).__openPioneerMap;
    return map && map.layers.getOperationalLayers().some((l: any) => l.visible);
  })).toBe(true);

  // 1. Open the printing panel
  const printToggle = page.getByTestId('print-toggle');
  const currentPrintState = await printToggle.evaluate((el: any) => el.getAttribute('aria-pressed') === 'true');
  if (!currentPrintState) {
    await printToggle.click();
  }
  await expect(page.getByTestId('printing-panel')).toBeVisible();

  // 2. Enter a title for the printout
  const printingPanel = page.getByTestId('printing-panel');
  const titleInput = printingPanel.getByLabel(/title/i).first();
  if (await titleInput.isVisible()) {
    await titleInput.fill('Test Map Printout');
  }

  // 3. Select PNG format
  const formatDropdown = printingPanel.getByLabel(/format/i).first();
  if (await formatDropdown.isVisible()) {
    await formatDropdown.selectOption('PNG');
  } else {
    // Fallback: try to find a radio or button group for format
    const pngOption = printingPanel.getByRole('radio', { name: /PNG/i }).first();
    if (await pngOption.isVisible()) {
      await pngOption.click();
    }
  }

  // 4. Trigger export/print
  const downloadPromise = page.waitForEvent('download');
  const exportButton = printingPanel.getByRole('button', { name: /print|export|download/i }).first();
  if (await exportButton.isVisible()) {
    await exportButton.click();
  } else {
    // Fallback: try any visible button in the printing panel if specific label not found
    const anyButton = printingPanel.getByRole('button').first();
    if (await anyButton.isVisible()) {
      await anyButton.click();
    }
  }

  // Assert download occurred
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);
});
