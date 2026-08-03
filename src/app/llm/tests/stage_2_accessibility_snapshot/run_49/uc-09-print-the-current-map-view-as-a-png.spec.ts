// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();

  const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelect).toBeVisible();
  await expect(basemapSelect).toHaveValue(/\S+/);

  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const initialTextboxCount = await page.getByRole('textbox').count();
  const initialComboboxCount = await page.getByRole('combobox').count();

  await page.getByTestId('print-toggle').click();

  let titleInput = page.getByRole('textbox', { name: /title/i }).first();
  if ((await titleInput.count()) === 0) {
    await expect.poll(async () => await page.getByRole('textbox').count()).toBeGreaterThan(initialTextboxCount);
    titleInput = page.getByRole('textbox').last();
  }
  await expect(titleInput).toBeVisible();

  const printTitle = 'E2E PNG map export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  let pngSelected = false;

  const pngRadio = page.getByRole('radio', { name: /^png$/i }).first();
  if ((await pngRadio.count()) > 0) {
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
    pngSelected = true;
  }

  if (!pngSelected) {
    let formatCombobox = page.getByRole('combobox', { name: /format/i }).first();
    if ((await formatCombobox.count()) === 0) {
      const currentComboboxCount = await page.getByRole('combobox').count();
      if (currentComboboxCount > initialComboboxCount) {
        formatCombobox = page.getByRole('combobox').last();
      }
    }

    if ((await formatCombobox.count()) > 0) {
      await expect(formatCombobox).toBeVisible();

      try {
        await formatCombobox.selectOption({ label: 'PNG' });
      } catch {
        try {
          await formatCombobox.selectOption({ label: 'png' });
        } catch {
          try {
            await formatCombobox.selectOption({ value: 'png' });
          } catch {
            await formatCombobox.click();
            await page.getByRole('option', { name: /^png$/i }).click();
          }
        }
      }

      const tagName = await formatCombobox.evaluate((element) => element.tagName.toLowerCase());
      if (tagName === 'select') {
        await expect.poll(async () => {
          return await formatCombobox.evaluate((element) => {
            const select = element as HTMLSelectElement;
            return select.selectedOptions[0]?.textContent?.trim() ?? select.value;
          });
        }).toMatch(/png/i);
      } else {
        await expect.poll(async () => await formatCombobox.inputValue()).toMatch(/png/i);
      }

      pngSelected = true;
    }
  }

  if (!pngSelected) {
    const pngButton = page.getByRole('button', { name: /^png$/i }).first();
    await expect(pngButton).toBeVisible();
    await pngButton.click();
    pngSelected = true;
  }

  expect(pngSelected).toBe(true);

  let exportButton = page.getByRole('button', { name: /^export$/i }).first();
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^download$/i }).first();
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^print$/i }).first();
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^print map$/i }).last();
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  const failure = await download.failure();
  expect(failure).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadedFilePath = await download.path();
  expect(downloadedFilePath).not.toBeNull();

  const fileContent = await readFile(downloadedFilePath!);
  expect(fileContent.length).toBeGreaterThan(8);
  expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
