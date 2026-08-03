// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelect).toBeVisible();
  await expect.poll(async () => await basemapSelect.inputValue()).toMatch(/\S+/);

  const operationalLayers = page.getByRole('list', { name: 'Operational layers', exact: true });
  await expect(operationalLayers).toBeVisible();

  const temperatureLayer = operationalLayers.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureLayer).toBeChecked();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const titleCandidates = [
    page.getByRole('textbox', { name: 'Title', exact: true }),
    page.getByRole('textbox', { name: 'Map title', exact: true }),
    page.getByLabel(/^Title$/i),
    page.getByLabel(/^Map title$/i),
    page.getByPlaceholder(/title/i)
  ];

  let titleInput = titleCandidates[0];
  let titleInputVisible = false;

  for (const candidate of titleCandidates) {
    if (await candidate.isVisible()) {
      titleInput = candidate;
      titleInputVisible = true;
      break;
    }
  }

  if (!titleInputVisible) {
    await printToggle.click();

    for (const candidate of titleCandidates) {
      if (await candidate.isVisible()) {
        titleInput = candidate;
        titleInputVisible = true;
        break;
      }
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'Current Weather Map';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  let formatSelected = false;

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
    formatSelected = true;
  }

  if (!formatSelected) {
    const formatCandidates = [
      page.getByRole('combobox', { name: 'Format', exact: true }),
      page.getByRole('combobox', { name: 'File format', exact: true }),
      page.getByLabel(/^Format$/i),
      page.getByLabel(/^File format$/i)
    ];

    let formatControl = formatCandidates[0];
    let formatControlVisible = false;

    for (const candidate of formatCandidates) {
      if (await candidate.isVisible()) {
        formatControl = candidate;
        formatControlVisible = true;
        break;
      }
    }

    await expect(formatControl).toBeVisible();

    try {
      await formatControl.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatControl.selectOption('PNG');
      } catch {
        await formatControl.selectOption('png');
      }
    }

    await expect
      .poll(async () =>
        await formatControl.evaluate(element => {
          const select = element as HTMLSelectElement;
          const selectedText = select.selectedOptions?.[0]?.textContent?.trim() ?? '';
          return selectedText || select.value || '';
        })
      )
      .toMatch(/png/i);

    formatSelected = true;
  }

  expect(formatSelected).toBe(true);

  const exportButtonCandidates = [
    page.getByRole('button', { name: 'Export', exact: true }),
    page.getByRole('button', { name: 'Download', exact: true }),
    page.getByRole('button', { name: 'Print', exact: true }),
    page.getByRole('button', { name: 'Export Map', exact: true }),
    page.getByRole('button', { name: 'Export map', exact: true }),
    page.getByRole('button', { name: 'Download PNG', exact: true })
  ];

  let exportButton = exportButtonCandidates[0];
  let exportButtonVisible = false;

  for (const candidate of exportButtonCandidates) {
    if (await candidate.isVisible()) {
      exportButton = candidate;
      exportButtonVisible = true;
      break;
    }
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect.poll(async () => download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error('Expected a downloaded file path for the exported PNG.');
  }

  const fileBuffer = await readFile(downloadPath);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  expect(fileBuffer.byteLength).toBeGreaterThan(1024);
});
