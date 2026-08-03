// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelect).toBeVisible();
  await expect(basemapSelect).toHaveValue(/.+/);

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(eucosCheckbox).toBeChecked();
  await expect(temperatureCheckbox).toBeChecked();

  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  let titleInput = page.getByRole('textbox', { name: /title/i });
  if (await titleInput.count() === 0) {
    titleInput = page.getByLabel(/title/i);
  }
  if (await titleInput.count() === 0) {
    titleInput = page.getByPlaceholder(/title/i);
  }

  if (!(await titleInput.isVisible())) {
    await page.getByTestId('print-toggle').click();
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'Weather map PNG export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^PNG\b/i });
  if (await pngRadio.count() > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    let formatControl = page.getByRole('combobox', {
      name: /format|file type|file format|output format/i
    });
    if (await formatControl.count() === 0) {
      formatControl = page.getByLabel(/format|file type|file format|output format/i);
    }

    await expect(formatControl).toBeVisible();

    try {
      await formatControl.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatControl.selectOption({ value: 'png' });
      } catch {
        await formatControl.click();
        await page.getByRole('option', { name: /^PNG\b/i }).click();
      }
    }

    await expect.poll(async () => await formatControl.inputValue()).toMatch(/png/i);
  }

  const exportButton = page.getByRole('button', {
    name: /^(Export|Export Map|Print|Download|Create export|Generate)$/i
  });
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileContent = await readFile(downloadPath!);
  expect(fileContent.length).toBeGreaterThan(1024);
  expect(fileContent.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
});
