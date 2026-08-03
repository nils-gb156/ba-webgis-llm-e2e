// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line').first();
  await expect(scaleBar).toBeVisible();
  await expect(scaleBar).toContainText(/\S+/);

  const titleInput = page.getByLabel(/^Title$/i);
  if (!(await titleInput.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Current map view PNG export');

  const pngRadioGroupOption = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadioGroupOption.count()) > 0) {
    const pngRadio = pngRadioGroupOption.first();
    if (!(await pngRadio.isChecked())) {
      await pngRadio.click({ force: true });
    }
    await expect(pngRadio).toBeChecked();
  } else {
    const formatComboboxGroup = page.getByRole('combobox', { name: /format/i });
    if ((await formatComboboxGroup.count()) > 0) {
      const formatCombobox = formatComboboxGroup.first();
      const tagName = await formatCombobox.evaluate((element) => element.tagName.toLowerCase());

      if (tagName === 'select') {
        await formatCombobox.selectOption({ label: 'PNG' });
        await expect(formatCombobox).toHaveValue(/png/i);
      } else {
        await formatCombobox.click();
        await page.getByRole('option', { name: 'PNG', exact: true }).click();
        await expect(formatCombobox).toContainText('PNG');
      }
    } else {
      const formatButton = page.getByRole('button', { name: /format/i }).first();
      await expect(formatButton).toBeVisible();
      await formatButton.click();
      await page.getByRole('option', { name: 'PNG', exact: true }).click();
      await expect(formatButton).toContainText('PNG');
    }
  }

  let actionButton = page.getByRole('button', { name: /^Export$/i }).first();
  if ((await page.getByRole('button', { name: /^Export$/i }).count()) === 0 || !(await actionButton.isVisible())) {
    actionButton = page.getByRole('button', { name: /^Print$/i }).first();
  }
  if ((await page.getByRole('button', { name: /^Print$/i }).count()) === 0 || !(await actionButton.isVisible())) {
    actionButton = page.getByRole('button', { name: /^Download$/i }).first();
  }

  await expect(actionButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await actionButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  expect(await download.failure()).toBeNull();

  const downloadPath = test.info().outputPath(download.suggestedFilename());
  await download.saveAs(downloadPath);

  const fileBuffer = await fs.readFile(downloadPath);
  expect(fileBuffer.length).toBeGreaterThan(10_000);
  expect(fileBuffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);
  expect(width).toBeGreaterThan(100);
  expect(height).toBeGreaterThan(100);
});
