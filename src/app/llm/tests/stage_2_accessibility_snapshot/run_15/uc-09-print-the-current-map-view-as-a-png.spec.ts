// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();
  await printToggle.click();

  const titleInput = page.getByLabel(/title/i);
  await expect(titleInput).toBeVisible();
  await titleInput.fill('UC9 Playwright PNG export');
  await expect(titleInput).toHaveValue('UC9 Playwright PNG export');

  const formatCombobox = page.getByRole('combobox', { name: /format/i });
  const formatComboboxCount = await formatCombobox.count();

  if (formatComboboxCount > 0) {
    await expect(formatCombobox).toBeVisible();

    const pngOptionValue = await formatCombobox.evaluate((el) => {
      if (!(el instanceof HTMLSelectElement)) {
        return undefined;
      }

      const pngOption = Array.from(el.options).find((option) => {
        const candidate = `${option.label} ${option.text} ${option.value}`;
        return /png/i.test(candidate);
      });

      return pngOption?.value;
    });

    if (pngOptionValue) {
      await formatCombobox.selectOption(pngOptionValue);
      await expect(formatCombobox).toHaveValue(pngOptionValue);
    } else {
      await formatCombobox.click();
      const pngOption = page.getByRole('option', { name: /png/i });
      await expect(pngOption).toBeVisible();
      await pngOption.click();
    }
  } else {
    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  }

  let exportButton = page.getByRole('button', { name: 'Export', exact: true });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Download', exact: true });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Print', exact: true });
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (!downloadPath) {
    throw new Error('Download path is not available.');
  }

  const fileBuffer = await readFile(downloadPath);
  expect(fileBuffer.length).toBeGreaterThan(100);
  expect(fileBuffer.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
});
