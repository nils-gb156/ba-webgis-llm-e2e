// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapCombobox).toBeVisible();

  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(eucosLayerCheckbox).toBeChecked();
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(page.getByTestId('legend')).toBeVisible();
  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const titleInput = page.getByLabel(/title/i);
  if (!(await titleInput.isVisible())) {
    await printToggle.click();
  }

  await expect(titleInput).toBeVisible();

  const formatField = page.getByLabel(/format/i);
  const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
  const pngButton = page.getByRole('button', { name: /^PNG$/i });
  const pngOption = page.getByRole('option', { name: /^PNG$/i });

  await titleInput.fill('Weather map export');

  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else if (await pngButton.isVisible()) {
    await pngButton.click();
  } else {
    await expect(formatField).toBeVisible();

    const tagName = await formatField.evaluate((element) => element.tagName);
    if (tagName === 'SELECT') {
      await formatField.evaluate((element) => {
        const select = element as HTMLSelectElement;
        const png = Array.from(select.options).find(
          (option) =>
            /png/i.test(option.label) ||
            /png/i.test(option.text) ||
            /png/i.test(option.value)
        );
        if (!png) {
          throw new Error('PNG option not found in format selector.');
        }
        select.value = png.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await expect.poll(async () => await formatField.inputValue()).toMatch(/png/i);
    } else {
      await formatField.click();
      if (await pngOption.isVisible()) {
        await pngOption.click();
      } else {
        await page.getByText(/^PNG$/).click();
      }
    }
  }

  const exportButton = page
    .getByRole('button', { name: /^(export|download|create|generate|print)$/i })
    .first();
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  expect(await download.failure()).toBeNull();
});
