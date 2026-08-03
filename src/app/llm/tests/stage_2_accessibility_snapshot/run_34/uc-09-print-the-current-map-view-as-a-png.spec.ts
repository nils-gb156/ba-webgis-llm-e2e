// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();

  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('legend')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  const printTogglePressed = await printToggle.getAttribute('aria-pressed');
  if (printTogglePressed !== 'true') {
    await printToggle.click();
  }

  const titleCandidates = [
    page.getByLabel(/title/i),
    page.getByRole('textbox', { name: /title/i }),
    page.getByPlaceholder(/title/i)
  ];
  let titleInput = titleCandidates[0];
  for (const candidate of titleCandidates) {
    if ((await candidate.count()) > 0) {
      titleInput = candidate;
      break;
    }
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Playwright PNG export');

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatCandidates = [
      page.getByLabel(/format/i),
      page.getByRole('combobox', { name: /format/i })
    ];
    let formatControl = formatCandidates[0];
    for (const candidate of formatCandidates) {
      if ((await candidate.count()) > 0) {
        formatControl = candidate;
        break;
      }
    }

    await expect(formatControl).toBeVisible();

    let selectedViaNativeControl = false;
    try {
      const selectedValues = await formatControl.selectOption({ label: 'PNG' });
      selectedViaNativeControl = selectedValues.length > 0;
    } catch {
      // fall through to alternate selection strategies
    }

    if (!selectedViaNativeControl) {
      try {
        const selectedValues = await formatControl.selectOption({ value: 'png' });
        selectedViaNativeControl = selectedValues.length > 0;
      } catch {
        // fall through to custom combobox handling
      }
    }

    if (selectedViaNativeControl) {
      await expect(formatControl).toHaveValue(/png/i);
    } else {
      await formatControl.click();
      const pngOption = page.getByRole('option', { name: 'PNG', exact: true });
      await expect(pngOption).toBeVisible();
      await pngOption.click();
    }
  }

  const exportButtonCandidates = [
    page.getByRole('button', { name: 'Export', exact: true }),
    page.getByRole('button', { name: 'Print', exact: true }),
    page.getByRole('button', { name: 'Download', exact: true }),
    page.getByRole('button', { name: /export/i }),
    page.getByRole('button', { name: /download/i }),
    page.getByRole('button', { name: /^print$/i })
  ];
  let exportButton = exportButtonCandidates[0];
  for (const candidate of exportButtonCandidates) {
    if ((await candidate.count()) > 0) {
      exportButton = candidate;
      break;
    }
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const fileBuffer = await fs.readFile(downloadPath);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(fileBuffer.length).toBeGreaterThan(1024);
    expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  }
});
