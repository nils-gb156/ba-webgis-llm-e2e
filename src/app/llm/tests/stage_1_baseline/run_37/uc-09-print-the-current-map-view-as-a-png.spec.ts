// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line').first();
  await expect(scaleBar).toBeVisible();

  const printToolbarButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printToolbarButton).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i }).first();
  if (!(await titleInput.isVisible().catch(() => false))) {
    await printToolbarButton.click();
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('E2E map export PNG');

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  const formatSelect = page.getByRole('combobox', { name: /format/i }).first();

  if (await pngRadio.isVisible().catch(() => false)) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else if (await formatSelect.isVisible().catch(() => false)) {
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  } else {
    const pngLabeledControl = page.getByLabel('PNG', { exact: true });
    await expect(pngLabeledControl).toBeVisible();
    await pngLabeledControl.click({ force: true });
  }

  const exportButton = page.getByRole('button', { name: 'Export', exact: true });
  const printButton = page.getByRole('button', { name: 'Print', exact: true });

  const downloadPromise = page.waitForEvent('download');

  if (await exportButton.isVisible().catch(() => false)) {
    await expect(exportButton).toBeEnabled();
    await exportButton.click();
  } else {
    await expect(printButton).toBeEnabled();
    await printButton.click();
  }

  const download = await downloadPromise;
  await expect(titleInput).toBeVisible();

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const savedFile = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(savedFile);

  const fileBuffer = await readFile(savedFile);
  expect(fileBuffer.length).toBeGreaterThan(1000);
  expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(fileBuffer.subarray(12, 16).toString('ascii')).toBe('IHDR');
  expect(fileBuffer.readUInt32BE(16)).toBeGreaterThan(0);
  expect(fileBuffer.readUInt32BE(20)).toBeGreaterThan(0);
});
