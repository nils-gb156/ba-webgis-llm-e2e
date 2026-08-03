// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();

  await page.getByTestId('print-toggle').click();

  const titleField = page.getByRole('textbox', { name: /title/i }).first();
  await expect(titleField).toBeVisible();

  const candidateRoots = [
    page.getByRole('dialog').filter({ has: titleField }),
    page.getByRole('region').filter({ has: titleField }),
    page.locator('form').filter({ has: titleField }),
    page.locator('section').filter({ has: titleField })
  ];

  let panelScope = page;
  let scopedToPrintPanel = false;

  for (const candidate of candidateRoots) {
    if ((await candidate.count()) > 0) {
      panelScope = candidate.first();
      scopedToPrintPanel = true;
      break;
    }
  }

  await expect(titleField).toBeVisible();

  const printTitle = 'Playwright PNG export';
  await titleField.fill(printTitle);
  await expect(titleField).toHaveValue(printTitle);

  const pngRadio = panelScope.getByRole('radio', { name: /png/i });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.first().click({ force: true });
    await expect(pngRadio.first()).toBeChecked();
  } else {
    const formatControl = panelScope.getByRole('combobox', { name: /format/i }).first();
    await expect(formatControl).toBeVisible();

    let selectedPng = false;

    try {
      await formatControl.selectOption({ label: 'PNG' });
      selectedPng = true;
    } catch {}

    if (!selectedPng) {
      try {
        await formatControl.selectOption({ value: 'png' });
        selectedPng = true;
      } catch {}
    }

    if (!selectedPng) {
      await formatControl.click();
      await panelScope.getByRole('option', { name: /png/i }).first().click();
    }

    await expect.poll(async () => {
      try {
        return await formatControl.inputValue();
      } catch {
        return (await formatControl.textContent()) ?? '';
      }
    }).toMatch(/png/i);
  }

  const exportButtonCandidates = [
    panelScope.getByRole('button', { name: /^(Export|Print|Download|Create)$/i }),
    panelScope.getByRole('button', { name: /^(Export|Print|Download|Create) Printout$/i })
  ];

  if (scopedToPrintPanel) {
    exportButtonCandidates.push(
      panelScope.getByRole('button', { name: /^(Export|Print|Download|Create) Map$/i }),
      panelScope.getByRole('button', { name: /^(Export|Print|Download|Create) Image$/i }),
      panelScope.getByRole('button', { name: /^Print Map$/i })
    );
  }

  let exportButton = exportButtonCandidates[0].first();
  for (const candidate of exportButtonCandidates) {
    if ((await candidate.count()) > 0) {
      exportButton = candidate.first();
      break;
    }
  }

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  expect(await download.failure()).toBeNull();
  await expect.poll(async () => await download.path()).not.toBeNull();
});
