// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9 - Print the current map view as a PNG', async ({ page }, testInfo) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    const findTitleInput = async () => {
        const labeledInput = page.getByLabel(/title/i).first();
        if (await labeledInput.isVisible()) {
            return labeledInput;
        }

        const placeholderInput = page.getByPlaceholder(/title/i).first();
        if (await placeholderInput.isVisible()) {
            return placeholderInput;
        }

        return null;
    };

    if ((await findTitleInput()) === null) {
        await page.getByTestId('print-toggle').click();
    }

    await expect.poll(async () => (await findTitleInput()) !== null).toBe(true);
    const titleInput = await findTitleInput();
    expect(titleInput).not.toBeNull();
    await expect(titleInput!).toBeVisible();

    const printTitle = 'Weather map export';
    await titleInput!.fill(printTitle);
    await expect(titleInput!).toHaveValue(printTitle);

    let pngFormatSelected = false;
    const comboboxes = await page.getByRole('combobox').all();
    for (const combobox of comboboxes) {
        if (!(await combobox.isVisible())) {
            continue;
        }

        const pngValue = await combobox.evaluate((element) => {
            if (!(element instanceof HTMLSelectElement)) {
                return null;
            }

            const option = Array.from(element.options).find(
                (entry) =>
                    /png/i.test(entry.label) ||
                    /png/i.test(entry.text) ||
                    /png/i.test(entry.value)
            );

            return option?.value ?? null;
        });

        if (pngValue !== null) {
            await combobox.selectOption(pngValue);
            await expect(combobox).toHaveValue(pngValue);
            pngFormatSelected = true;
            break;
        }
    }

    if (!pngFormatSelected) {
        const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
        if (await pngRadio.count()) {
            await pngRadio.click({ force: true });
            await expect(pngRadio).toBeChecked();
            pngFormatSelected = true;
        }
    }

    expect(pngFormatSelected).toBe(true);

    const exportButton = page.getByRole('button', { name: /^(Export|Print|Download)$/i });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const outputFile = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(outputFile);

    const fileBytes = await readFile(outputFile);
    expect(fileBytes.length).toBeGreaterThan(10_000);
    expect(Array.from(fileBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const width = fileBytes.readUInt32BE(16);
    const height = fileBytes.readUInt32BE(20);
    expect(width).toBeGreaterThan(200);
    expect(height).toBeGreaterThan(200);
});
