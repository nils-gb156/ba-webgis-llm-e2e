// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const printTitle = 'Current Weather Map';

  const titleCandidates = [
    page.getByRole('textbox', { name: /title/i }),
    page.getByLabel(/title/i)
  ];

  let titleField = titleCandidates[0].first();
  let printPanelVisible = false;

  for (const candidate of titleCandidates) {
    const locator = candidate.first();
    if (await locator.isVisible().catch(() => false)) {
      titleField = locator;
      printPanelVisible = true;
      break;
    }
  }

  if (!printPanelVisible) {
    await page.getByTestId('print-toggle').click();

    for (const candidate of titleCandidates) {
      const locator = candidate.first();
      if (await locator.isVisible().catch(() => false)) {
        titleField = locator;
        break;
      }
    }
  }

  await expect(titleField).toBeVisible();
  await titleField.fill(printTitle);
  await expect(titleField).toHaveValue(printTitle);

  const pngRadioCandidates = [
    page.getByRole('radio', { name: /^PNG$/i }),
    page.getByLabel(/^PNG$/i)
  ];

  let pngRadio = pngRadioCandidates[0].first();
  let pngSelectedViaRadio = false;

  for (const candidate of pngRadioCandidates) {
    const locator = candidate.first();
    if (await locator.isVisible().catch(() => false)) {
      pngRadio = locator;
      pngSelectedViaRadio = true;
      break;
    }
  }

  if (pngSelectedViaRadio) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatCandidates = [
      page.getByRole('combobox', { name: /format/i }),
      page.getByLabel(/format/i)
    ];

    let formatControl = formatCandidates[0].first();
    for (const candidate of formatCandidates) {
      const locator = candidate.first();
      if (await locator.isVisible().catch(() => false)) {
        formatControl = locator;
        break;
      }
    }

    await expect(formatControl).toBeVisible();

    const tagName = await formatControl.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'select') {
      const pngOption = await formatControl.evaluate((el) => {
        if (!(el instanceof HTMLSelectElement)) {
          return null;
        }

        const option = Array.from(el.options).find(
          (candidate) => /png/i.test(candidate.label) || /png/i.test(candidate.value)
        );

        return option ? { value: option.value } : null;
      });

      if (pngOption === null) {
        throw new Error('No PNG option available in the format selector.');
      }

      await formatControl.selectOption(pngOption.value);
      await expect.poll(async () => await formatControl.inputValue()).toMatch(/png/i);
    } else {
      await formatControl.click();

      const pngOptionCandidates = [
        page.getByRole('option', { name: /^PNG$/i }),
        page.getByRole('menuitemradio', { name: /^PNG$/i }),
        page.getByText(/^PNG$/i)
      ];

      let pngOption = pngOptionCandidates[0].first();
      for (const candidate of pngOptionCandidates) {
        const locator = candidate.first();
        if (await locator.isVisible().catch(() => false)) {
          pngOption = locator;
          break;
        }
      }

      await expect(pngOption).toBeVisible();
      await pngOption.click();
    }
  }

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^Export$/i }),
    page.getByRole('button', { name: /^Print$/i }),
    page.getByRole('button', { name: /^Download$/i }),
    page.getByRole('button', { name: /^Create Print$/i }),
    page.getByRole('button', { name: /^Create Export$/i })
  ];

  let exportButton = exportButtonCandidates[0].first();
  for (const candidate of exportButtonCandidates) {
    const locator = candidate.first();
    if (await locator.isVisible().catch(() => false)) {
      exportButton = locator;
      break;
    }
  }

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect.poll(async () => await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});
