// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  if (!(await titleInput.isVisible())) {
    const pressed = await printToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printToggle.click();
    }
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Current weather map');
  await expect(titleInput).toHaveValue('Current weather map');

  const pngRadio = page.getByRole('radio', { name: /^png$/i });
  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  const exportButton = page.getByRole('button', { name: /^(export|print|download)$/i });
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileContent = await readFile(downloadPath as string);
  expect(fileContent.byteLength).toBeGreaterThan(0);
  expect(fileContent.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );

  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
});
