// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
  }

  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapCombobox).toBeVisible();
  await expect.poll(async () => await basemapCombobox.inputValue()).not.toBe('');

  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const titleCandidates = [
    page.getByRole('textbox', { name: /title/i }),
    page.getByLabel(/title/i),
    page.getByPlaceholder(/title/i)
  ];

  let titleInput = titleCandidates[0];
  let titleInputFound = false;
  for (const candidate of titleCandidates) {
    if (await candidate.isVisible()) {
      titleInput = candidate;
      titleInputFound = true;
      break;
    }
  }

  if (!titleInputFound) {
    await printToggle.click();
    for (const candidate of titleCandidates) {
      if (await candidate.isVisible()) {
        titleInput = candidate;
        titleInputFound = true;
        break;
      }
    }
  }

  expect(titleInputFound).toBeTruthy();
  await expect(titleInput).toBeVisible();

  const printTitle = 'Weather map export PNG';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatCandidates = [
      page.getByRole('combobox', { name: /format/i }),
      page.getByLabel(/format/i)
    ];

    let formatCombobox = formatCandidates[0];
    let formatFound = false;
    for (const candidate of formatCandidates) {
      if (await candidate.isVisible()) {
        formatCombobox = candidate;
        formatFound = true;
        break;
      }
    }

    expect(formatFound).toBeTruthy();
    await expect(formatCombobox).toBeVisible();

    const pngOption = formatCombobox.getByRole('option', { name: /png/i });
    await expect(pngOption).toBeVisible();

    const pngValue = await pngOption.getAttribute('value');
    const pngLabel = (await pngOption.textContent())?.trim();

    if (pngValue) {
      await formatCombobox.selectOption(pngValue);
    } else if (pngLabel) {
      await formatCombobox.selectOption({ label: pngLabel });
    } else {
      throw new Error('Could not determine PNG option value or label.');
    }

    await expect
      .poll(async () => {
        return await formatCombobox.evaluate((element) => {
          const select = element as HTMLSelectElement;
          return select.selectedOptions[0]?.textContent?.trim() ?? '';
        });
      })
      .toMatch(/png/i);
  }

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^Export$/i }),
    page.getByRole('button', { name: /^Print$/i }),
    page.getByRole('button', { name: /^Create$/i }),
    page.getByRole('button', { name: /^Download$/i }),
    page.getByRole('button', { name: /^Generate$/i })
  ];

  let exportButton = exportButtonCandidates[0];
  let exportButtonFound = false;
  for (const candidate of exportButtonCandidates) {
    if (await candidate.isVisible()) {
      exportButton = candidate;
      exportButtonFound = true;
      break;
    }
  }

  expect(exportButtonFound).toBeTruthy();
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  await expect.poll(async () => download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error('Download path is not available.');
  }

  const fileBuffer = await readFile(downloadPath);
  expect(fileBuffer.length).toBeGreaterThan(1024);
  expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
