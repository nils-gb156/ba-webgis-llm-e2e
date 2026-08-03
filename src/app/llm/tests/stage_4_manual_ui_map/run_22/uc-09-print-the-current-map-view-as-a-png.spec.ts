// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    const printing = page.getByTestId('printing');
    await expect(printing).toBeVisible();

    const title = 'Weather overview export';
    let titleInput = printing.getByLabel(/title/i);
    if (!(await titleInput.count())) {
        titleInput = printing.getByRole('textbox', { name: /title/i });
    }
    if (!(await titleInput.count())) {
        titleInput = printing.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);
    await expect(titleInput).toHaveValue(title);

    const formatSelect = printing.getByRole('combobox', { name: /format/i });
    if (await formatSelect.count()) {
        const pngValue = await formatSelect.evaluate((element) => {
            const select = element as HTMLSelectElement;
            const options = Array.from(select.options ?? []);
            const pngOption = options.find(
                (option) => /png/i.test(option.text) || /png/i.test(option.value)
            );
            return pngOption?.value;
        });
        expect(pngValue).toBeTruthy();
        await formatSelect.selectOption(pngValue!);
        await expect.poll(() => formatSelect.inputValue()).toMatch(/png/i);
    } else {
        let pngRadio = printing.getByRole('radio', { name: /^png$/i });
        if (!(await pngRadio.count())) {
            pngRadio = printing.getByRole('radio', { name: /png/i });
        }

        if (await pngRadio.count()) {
            await pngRadio.click({ force: true });
            await expect(pngRadio).toBeChecked();
        } else {
            let pngOption = printing.getByRole('option', { name: /^png$/i });
            if (!(await pngOption.count())) {
                pngOption = printing.getByRole('button', { name: /^png$/i });
            }
            if (!(await pngOption.count())) {
                pngOption = printing.getByRole('option', { name: /png/i });
            }
            if (!(await pngOption.count())) {
                pngOption = printing.getByRole('button', { name: /png/i });
            }

            await expect(pngOption).toBeVisible();
            await pngOption.click();
        }
    }

    let exportButton = printing.getByRole('button', { name: /^export$/i });
    if (!(await exportButton.count())) {
        exportButton = printing.getByRole('button', { name: /^print$/i });
    }
    if (!(await exportButton.count())) {
        exportButton = printing.getByRole('button', { name: /^download$/i });
    }
    if (!(await exportButton.count())) {
        exportButton = printing.getByRole('button', { name: /export|print|download/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const failure = await download.failure();
    expect(failure).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const content = await readFile(downloadPath);
        expect(content.length).toBeGreaterThan(1000);
        expect(content.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    }
});
