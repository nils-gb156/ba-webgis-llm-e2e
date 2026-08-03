// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const mapToolbar = page.getByTestId('map-toolbar');
  const printToggle = page.getByTestId('print-toggle');
  const printingPanel = page.getByTestId('printing-panel');
  const printingContent = page.getByTestId('printing');
  const scaleBar = page.getByTestId('scale-bar');

  await expect(mapContainer).toBeVisible();
  await expect(mapToolbar).toBeVisible();
  await expect(printToggle).toBeVisible();
  await expect(scaleBar).toBeVisible();

  await expect
    .poll(async () => {
      const activeBaseLayer = await getActiveBaseLayerTitle(page);
      return ['Carto Light', 'Carto Dark', 'OpenStreetMap'].includes(activeBaseLayer ?? '');
    })
    .toBe(true);

  await expect
    .poll(async () => {
      const visibleOperationalLayers = await Promise.all([
        isLayerRendered(page, 'Temperature'),
        isLayerRendered(page, 'UV-Index Stations'),
        isLayerRendered(page, 'EUCOS Ground Stations'),
        isLayerRendered(page, 'UV-Index'),
        isLayerRendered(page, 'Precipitation'),
        isLayerRendered(page, 'Clouds')
      ]);
      return visibleOperationalLayers.some(Boolean);
    })
    .toBe(true);

  if (!(await printingPanel.isVisible())) {
    await printToggle.click();
  }

  await expect(printingPanel).toBeVisible();
  await expect(printingContent).toBeVisible();

  let titleInput = printingPanel.getByRole('textbox', { name: 'Title', exact: true }).first();
  if ((await titleInput.count()) === 0) {
    titleInput = printingPanel.getByRole('textbox', { name: /map title/i }).first();
  }
  if ((await titleInput.count()) === 0) {
    titleInput = printingPanel.getByLabel(/title/i).first();
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Weather map export');

  let formatControl = printingPanel.getByRole('combobox', { name: 'Format', exact: true }).first();
  if ((await formatControl.count()) === 0) {
    formatControl = printingPanel.getByRole('combobox', { name: /output format/i }).first();
  }
  if ((await formatControl.count()) === 0) {
    formatControl = printingPanel.getByRole('combobox', { name: /file format/i }).first();
  }
  if ((await formatControl.count()) === 0) {
    formatControl = printingPanel.getByLabel(/format/i).first();
  }

  await expect(formatControl).toBeVisible();

  const formatTagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());
  if (formatTagName === 'select') {
    await formatControl.selectOption({ label: 'PNG' });
  } else {
    await formatControl.click();
    await page.getByRole('option', { name: 'PNG', exact: true }).click();
  }

  let exportButton = printingPanel.getByRole('button', { name: 'Export', exact: true }).first();
  if ((await exportButton.count()) === 0) {
    exportButton = printingPanel.getByRole('button', { name: 'Print', exact: true }).first();
  }
  if ((await exportButton.count()) === 0) {
    exportButton = printingPanel.getByRole('button', { name: /export/i }).first();
  }
  if ((await exportButton.count()) === 0) {
    exportButton = printingPanel.getByRole('button', { name: /print/i }).first();
  }

  await expect(exportButton).toBeVisible();
  await expect(scaleBar).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error('Expected a downloaded PNG file, but no download path was available.');
  }

  const fileBuffer = await fs.readFile(downloadPath);
  expect(fileBuffer.length).toBeGreaterThan(24);
  expect(fileBuffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(fileBuffer.readUInt32BE(16)).toBeGreaterThan(0);
  expect(fileBuffer.readUInt32BE(20)).toBeGreaterThan(0);
});
