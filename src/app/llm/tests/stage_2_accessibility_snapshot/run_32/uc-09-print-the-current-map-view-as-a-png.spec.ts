// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const scaleBar = page.getByTestId('scale-bar');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const legend = page.getByTestId('legend');

  await expect(mapContainer).toBeVisible();
  await expect(scaleBar).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(legend).toBeVisible();

  const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapSelect).toBeVisible();
  await expect(basemapSelect).not.toHaveValue('');

  const eucosLayer = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const uviStationsLayer = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  const temperatureLayer = page.getByRole('checkbox', { name: 'Temperature', exact: true });

  await expect(eucosLayer).toBeChecked();
  await expect(uviStationsLayer).toBeChecked();
  await expect(temperatureLayer).toBeChecked();

  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const titleFieldByRole = page.getByRole('textbox', { name: /title/i }).first();
  const titleFieldByLabel = page.getByLabel(/title/i).first();
  const titleFieldByPlaceholder = page.getByPlaceholder(/title/i).first();

  if (
    !(await titleFieldByRole.isVisible()) &&
    !(await titleFieldByLabel.isVisible()) &&
    !(await titleFieldByPlaceholder.isVisible())
  ) {
    await printToggle.click();
  }

  let titleField = titleFieldByRole;
  if (await titleFieldByRole.isVisible()) {
    titleField = titleFieldByRole;
  } else if (await titleFieldByLabel.isVisible()) {
    titleField = titleFieldByLabel;
  } else {
    titleField = titleFieldByPlaceholder;
  }

  await expect(titleField).toBeVisible();

  const printTitle = 'UC9 PNG export';
  await titleField.fill(printTitle);
  await expect(titleField).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^png$/i }).first();
  const pngButton = page.getByRole('button', { name: /^png$/i }).first();
  const formatComboboxByRole = page.getByRole('combobox', { name: /format/i }).first();
  const formatComboboxByLabel = page.getByLabel(/format/i).first();

  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else if (await pngButton.isVisible()) {
    await pngButton.click();
  } else {
    let formatCombobox = formatComboboxByRole;
    if (!(await formatComboboxByRole.isVisible()) && (await formatComboboxByLabel.isVisible())) {
      formatCombobox = formatComboboxByLabel;
    }

    await expect(formatCombobox).toBeVisible();

    try {
      await formatCombobox.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatCombobox.selectOption('png');
      } catch {
        await formatCombobox.click();
        await page.getByRole('option', { name: /^png$/i }).click();
      }
    }

    await expect.poll(async () => (await formatCombobox.inputValue()).toLowerCase()).toMatch(/png/);
  }

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^export$/i }).first(),
    page.getByRole('button', { name: /^print$/i }).first(),
    page.getByRole('button', { name: /^download$/i }).first(),
    page.getByRole('button', { name: /^export map$/i }).first(),
  ];

  let exportButton = exportButtonCandidates[0];
  for (const candidate of exportButtonCandidates) {
    if (await candidate.isVisible()) {
      exportButton = candidate;
      break;
    }
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  if (!stream) {
    throw new Error('Expected a downloadable PNG file, but no download stream was available.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const fileContent = Buffer.concat(chunks);
  expect(fileContent.length).toBeGreaterThan(0);
  expect(fileContent.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
  expect(fileContent.length).toBeGreaterThan(1000);
});
