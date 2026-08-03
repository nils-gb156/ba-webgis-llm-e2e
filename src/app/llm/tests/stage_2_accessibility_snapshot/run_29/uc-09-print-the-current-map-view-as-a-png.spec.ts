// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelect).toBeVisible();
  await expect(basemapSelect).toContainText('Carto Light');

  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureLayerCheckbox).toBeChecked();

  await page.getByTestId('print-toggle').click();

  const printDialog = page.getByRole('dialog').first();
  await expect(printDialog).toBeVisible();

  let titleInput = printDialog.getByRole('textbox', { name: /title/i });
  if ((await titleInput.count()) === 0) {
    titleInput = printDialog.getByLabel(/title/i);
  }
  if ((await titleInput.count()) === 0) {
    titleInput = printDialog.getByPlaceholder(/title/i);
  }

  const printTitle = `Current map view ${Date.now()}`;
  await expect(titleInput).toBeVisible();
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = printDialog.getByRole('radio', { name: /^png$/i });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    let formatControl = printDialog.getByRole('combobox', { name: /format/i });
    if ((await formatControl.count()) === 0) {
      formatControl = printDialog.getByRole('button', { name: /format/i });
    }

    await expect(formatControl).toBeVisible();

    const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());
    if (tagName === 'select') {
      await formatControl.selectOption({ label: 'PNG' });
      await expect(formatControl).toHaveValue(/png/i);
    } else {
      await formatControl.click();

      const pngOption = page.getByRole('option', { name: /^png$/i });
      if ((await pngOption.count()) > 0) {
        await pngOption.click();
      } else {
        const pngMenuItem = page.getByRole('menuitemradio', { name: /^png$/i });
        await expect(pngMenuItem).toBeVisible();
        await pngMenuItem.click({ force: true });
      }
    }
  }

  let exportButton = printDialog.getByRole('button', { name: /export/i });
  if ((await exportButton.count()) === 0) {
    exportButton = printDialog.getByRole('button', { name: /^print$/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = printDialog.getByRole('button', { name: /download/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = printDialog.getByRole('button', { name: /create/i });
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect(download.failure()).resolves.toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream!.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream!.on('end', () => resolve());
    stream!.on('error', reject);
  });

  const fileBuffer = Buffer.concat(chunks);
  expect(fileBuffer.length).toBeGreaterThan(100);
  expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
