// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await page.getByTestId('print-toggle').click();

    const titleInput = page.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current Weather Map');
    await expect(titleInput).toHaveValue('Current Weather Map');

    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    if ((await formatCombobox.count()) > 0) {
        await expect(formatCombobox).toBeVisible();

        const pngOptionValue = await formatCombobox.evaluate((select) => {
            const htmlSelect = select as HTMLSelectElement;
            const option = Array.from(htmlSelect.options).find(
                (entry) =>
                    /png/i.test(entry.label) ||
                    /png/i.test(entry.text) ||
                    /png/i.test(entry.value)
            );
            return option?.value;
        });

        expect(pngOptionValue).toBeTruthy();
        await formatCombobox.selectOption(pngOptionValue!);

        await expect.poll(() =>
            formatCombobox.evaluate((select) => {
                const htmlSelect = select as HTMLSelectElement;
                const option = htmlSelect.selectedOptions[0];
                return option?.label ?? option?.text ?? '';
            })
        ).toMatch(/png/i);
    } else {
        const pngRadio = page.getByRole('radio', { name: /png/i });
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    }

    let exportButton = page.getByRole('button', { name: /export/i });
    if ((await exportButton.count()) === 0) {
        exportButton = page.getByRole('button', { name: /download/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = page.getByRole('button', { name: /^print$/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const failure = await download.failure();
    expect(failure).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.byteLength).toBeGreaterThan(5000);
    expect(fileContent.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
});
