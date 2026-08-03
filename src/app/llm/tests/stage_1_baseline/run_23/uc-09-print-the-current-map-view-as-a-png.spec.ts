// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();

  await expect(printMapButton).toBeVisible();
  await expect(scaleBar).toBeVisible();

  if (!(await printPanelHeading.isVisible())) {
    await printMapButton.click();
  }

  await expect(printPanelHeading).toBeVisible();

  const title = `E2E PNG Export ${Date.now()}`;
  const titleInput = page.getByRole('textbox', { name: /title/i }).first();

  await expect(titleInput).toBeVisible();
  await titleInput.fill(title);
  await expect(titleInput).toHaveValue(title);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    let formatCombobox = page.getByRole('combobox', { name: /format/i });
    if (!(await formatCombobox.first().isVisible())) {
      formatCombobox = page.getByRole('combobox');
    }

    const formatField = formatCombobox.first();
    await expect(formatField).toBeVisible();

    try {
      await formatField.selectOption({ label: 'PNG' });
    } catch {
      await formatField.selectOption('png');
    }

    await expect(formatField).toHaveValue(/png/i);
  }

  let exportButton = page.getByRole('button', { name: 'Export', exact: true });
  if (!(await exportButton.isVisible())) {
    exportButton = page.getByRole('button', { name: 'Print', exact: true });
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  let downloadedSize = 0;
  if (stream) {
    for await (const chunk of stream) {
      downloadedSize += chunk.length;
    }
  }

  expect(downloadedSize).toBeGreaterThan(0);
  await expect(scaleBar).toBeVisible();
});
