// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(basemapSelector).toBeVisible();
  await expect(basemapSelector).toHaveValue(/.+/);

  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToolbarButton = page.getByTestId('print-toggle');
  await expect(printToolbarButton).toBeVisible();
  await printToolbarButton.click();

  let titleField = page.getByRole('textbox', { name: /title/i });
  if ((await titleField.count()) === 0) {
    await expect.poll(async () => await page.getByRole('textbox').count()).toBeGreaterThan(1);
    titleField = page.getByRole('textbox').nth(1);
  }
  await expect(titleField).toBeVisible();

  const printTitle = 'Weather map export';
  await titleField.fill(printTitle);
  await expect(titleField).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^png$/i });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    let formatCombobox = page.getByRole('combobox', { name: /format/i });
    if ((await formatCombobox.count()) === 0) {
      await expect.poll(async () => await page.getByRole('combobox').count()).toBeGreaterThan(1);
      formatCombobox = page.getByRole('combobox').nth(1);
    }

    await expect(formatCombobox).toBeVisible();

    try {
      await formatCombobox.selectOption({ label: 'PNG' });
    } catch {
      await formatCombobox.click();
      await page.getByRole('option', { name: /^png$/i }).click();
    }

    await expect.poll(async () => {
      return (await formatCombobox.inputValue()).toLowerCase();
    }).toMatch(/png/);
  }

  let exportButton = page.getByRole('button', { name: /^export$/i });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /export/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^download$/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /download/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^print$/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /create/i });
  }

  await expect(exportButton.first()).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.first().click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error('Expected a downloaded file path for the PNG export.');
  }

  const fileContent = await readFile(downloadPath);
  expect(fileContent.length).toBeGreaterThan(1000);
  expect(fileContent.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
