// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isVisible = async (locator: ReturnType<typeof page.locator>) => {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  };

  const mapCanvas = page.locator('canvas').first();
  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  const titleInput = page.getByRole('textbox', { name: /^title$/i });
  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  const formatCombobox = page.getByRole('combobox', { name: /format/i });
  const pngToggleButton = page.getByRole('button', { name: 'PNG', exact: true });

  await expect(printMapButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();
  await expect(scaleBar).toBeVisible();

  if (!(await isVisible(titleInput))) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    const expanded = await printMapButton.getAttribute('aria-expanded');

    if (pressed !== 'true' && expanded !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const exportButton = (await isVisible(page.getByRole('button', { name: 'Export', exact: true })))
    ? page.getByRole('button', { name: 'Export', exact: true })
    : page.getByRole('button', { name: 'Print', exact: true });

  await expect(exportButton).toBeVisible();

  const printTitle = 'E2E PNG export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  if ((await pngRadio.count()) > 0 && (await isVisible(pngRadio.first()))) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else if ((await formatCombobox.count()) > 0 && (await isVisible(formatCombobox.first()))) {
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect(formatCombobox).toHaveValue(/png/i);
  } else {
    await expect(pngToggleButton).toBeVisible();
    await pngToggleButton.click();
    await expect(pngToggleButton).toHaveAttribute('aria-pressed', 'true');
  }

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect(titleInput).toBeVisible();
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const fileBuffer = await fs.readFile(downloadPath);
    expect(fileBuffer.byteLength).toBeGreaterThan(1024);
    expect(fileBuffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
});
