// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line').first();
  await expect(scaleBar).toBeVisible();
  await expect(scaleBar).toContainText(/m|km/);

  const titleInput = page.getByRole('textbox', { name: /title/i });

  if (!(await titleInput.isVisible())) {
    const isPressed = await printMapButton.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'Playwright PNG Export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  let pngSelected = false;

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
    pngSelected = true;
  }

  const formatCombobox = page.getByRole('combobox', { name: /format/i });
  if (!pngSelected && (await formatCombobox.count()) > 0) {
    await expect(formatCombobox).toBeVisible();
    try {
      await formatCombobox.selectOption({ label: 'PNG' });
    } catch {
      await formatCombobox.click();
      const pngOption = page.getByRole('option', { name: 'PNG', exact: true });
      if ((await pngOption.count()) > 0) {
        await expect(pngOption).toBeVisible();
        await pngOption.click();
      } else {
        const pngMenuItem = page.getByRole('menuitemradio', { name: 'PNG', exact: true });
        await expect(pngMenuItem).toBeVisible();
        await pngMenuItem.click({ force: true });
      }
    }
    pngSelected = true;
  }

  const formatButton = page.getByRole('button', { name: /format/i });
  if (!pngSelected && (await formatButton.count()) > 0) {
    await expect(formatButton).toBeVisible();
    await formatButton.click();

    const pngOption = page.getByRole('option', { name: 'PNG', exact: true });
    if ((await pngOption.count()) > 0) {
      await expect(pngOption).toBeVisible();
      await pngOption.click();
    } else {
      const pngMenuItemRadio = page.getByRole('menuitemradio', { name: 'PNG', exact: true });
      if ((await pngMenuItemRadio.count()) > 0) {
        await expect(pngMenuItemRadio).toBeVisible();
        await pngMenuItemRadio.click({ force: true });
      } else {
        const pngMenuItem = page.getByRole('menuitem', { name: 'PNG', exact: true });
        await expect(pngMenuItem).toBeVisible();
        await pngMenuItem.click();
      }
    }

    await expect(formatButton).toContainText('PNG');
    pngSelected = true;
  }

  expect(pngSelected).toBe(true);

  let exportButton = page.getByRole('button', { name: 'Export', exact: true });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Print', exact: true });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Create print', exact: true });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^(Export|Print|Create print)$/i });
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileContent = await readFile(downloadPath!);
  expect(fileContent.length).toBeGreaterThan(1000);
  expect(fileContent.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
