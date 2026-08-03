// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelect).toBeVisible();
  await expect(basemapSelect).toContainText('Carto Light');

  const visibleOverlayCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(visibleOverlayCheckbox).toBeVisible();
  await expect(visibleOverlayCheckbox).toBeChecked();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  let titleInput = page.getByRole('dialog').getByLabel(/title/i);
  if (!(await titleInput.isVisible())) {
    titleInput = page.getByLabel(/title/i);
  }

  if (!(await titleInput.isVisible())) {
    if ((await printToggle.getAttribute('aria-pressed')) !== 'true') {
      await printToggle.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'Current map view';
  await titleInput.fill(printTitle);

  let formatCombobox = page.getByRole('dialog').getByRole('combobox', { name: /format/i });
  if (!(await formatCombobox.isVisible())) {
    formatCombobox = page.getByRole('combobox', { name: /format/i });
  }

  if (await formatCombobox.isVisible()) {
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect(formatCombobox).toHaveValue(/png/i);
  } else {
    let pngRadio = page.getByRole('dialog').getByRole('radio', { name: /^png$/i });
    if (!(await pngRadio.isVisible())) {
      pngRadio = page.getByRole('radio', { name: /^png$/i });
    }
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  }

  let exportButton = page.getByRole('dialog').getByRole('button', { name: /export|download|print/i }).last();
  if (!(await exportButton.isVisible())) {
    exportButton = page.getByRole('button', { name: /export|download|print/i }).last();
  }
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  await expect.poll(async () => await download.failure()).toBeNull();

  const filePath = await download.path();
  expect(filePath).not.toBeNull();

  const fileBytes = await readFile(filePath!);
  expect(fileBytes.byteLength).toBeGreaterThan(1000);
  expect(Array.from(fileBytes.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(visibleOverlayCheckbox).toBeChecked();
});
