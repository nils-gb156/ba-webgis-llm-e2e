// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const printMapToggle = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapToggle).toBeVisible();

  await expect.poll(async () => await page.locator('.ol-layer').count()).toBeGreaterThan(1);
  await expect(page.locator('.ol-layer canvas').first()).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line').first();
  await expect(scaleBar).toBeVisible();

  let titleInput = page.getByRole('textbox', { name: /title/i });
  if ((await titleInput.count()) === 0) {
    titleInput = page.getByLabel(/title/i);
  }
  if ((await titleInput.count()) === 0) {
    titleInput = page.getByPlaceholder(/title/i);
  }

  if (!(await titleInput.isVisible())) {
    const pressed = await printMapToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapToggle.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = `E2E PNG export ${Date.now()}`;
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    let formatField = page.getByRole('combobox', { name: /format/i });
    if ((await formatField.count()) === 0) {
      formatField = page.getByLabel(/format/i);
    }

    if ((await formatField.count()) > 0) {
      await expect(formatField).toBeVisible();
      await formatField.selectOption({ label: 'PNG' });
      await expect(formatField).toHaveValue(/png/i);
    } else {
      const formatButton = page.getByRole('button', { name: /format/i });
      await expect(formatButton).toBeVisible();
      await formatButton.click();

      const pngOption = page.getByRole('option', { name: /^PNG$/i });
      const pngMenuItemRadio = page.getByRole('menuitemradio', { name: /^PNG$/i });
      const pngMenuItem = page.getByRole('menuitem', { name: /^PNG$/i });

      if ((await pngOption.count()) > 0) {
        await pngOption.click();
      } else if ((await pngMenuItemRadio.count()) > 0) {
        await pngMenuItemRadio.click({ force: true });
        await expect(pngMenuItemRadio).toHaveAttribute('aria-checked', 'true');
      } else {
        await pngMenuItem.click();
      }
    }
  }

  let exportButton = page.getByRole('button', { name: /^Export$/i });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^Download$/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^Print$/i });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^Create$/i });
  }

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error('Download path was not available.');
  }

  const fileContent = await readFile(downloadPath);
  expect(fileContent.byteLength).toBeGreaterThan(1000);
  expect(fileContent.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
});
