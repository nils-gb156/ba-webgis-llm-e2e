// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  if (!(await titleInput.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Current map view PNG export');

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  const formatCombobox = page.getByRole('combobox', { name: /format/i });

  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    await expect(formatCombobox).toBeVisible();
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect(formatCombobox).toHaveValue(/png/i);
  }

  const exportButton = page.getByRole('button', { name: 'Export', exact: true });
  const printButton = page.getByRole('button', { name: 'Print', exact: true });
  const triggerButton = (await exportButton.isVisible()) ? exportButton : printButton;

  await expect(triggerButton).toBeVisible();
  await expect(triggerButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await triggerButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  const outputPath = test.info().outputPath(suggestedFilename);
  await download.saveAs(outputPath);

  const fileBytes = await fs.readFile(outputPath);
  expect(fileBytes.byteLength).toBeGreaterThan(1024);
  expect(Array.from(fileBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
