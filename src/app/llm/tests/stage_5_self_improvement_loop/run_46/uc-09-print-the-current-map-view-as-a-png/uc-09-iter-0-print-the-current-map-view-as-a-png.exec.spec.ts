// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const pickVisible = async (entries: Array<[string, any]>) => {
        await expect
            .poll(async () => {
                for (const [name, locator] of entries) {
                    if (await locator.isVisible()) {
                        return name;
                    }
                }
                return '';
            })
            .not.toBe('');

        for (const [, locator] of entries) {
            if (await locator.isVisible()) {
                return locator;
            }
        }

        throw new Error('No visible locator found.');
    };

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    await expect(printToggle).toBeVisible();
    await printToggle.click();

    const titleInput = await pickVisible([
        ['label-title', page.getByLabel(/title/i)],
        ['role-title', page.getByRole('textbox', { name: /title/i })],
        ['placeholder-title', page.getByPlaceholder(/title/i)]
    ]);
    await expect(titleInput).toBeVisible();

    const formatControl = await pickVisible([
        ['png-radio', page.getByRole('radio', { name: /^PNG$/i })],
        ['format-label', page.getByLabel(/file format|format/i)],
        ['format-combobox', page.getByRole('combobox', { name: /file format|format/i })]
    ]);
    await expect(formatControl).toBeVisible();

    const printTitle = 'Playwright PNG export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        try {
            await formatControl.selectOption({ label: 'PNG' });
        } catch {
            await formatControl.click();

            const pngChoice = await pickVisible([
                ['option', page.getByRole('option', { name: /^PNG$/i })],
                ['menuitemradio', page.getByRole('menuitemradio', { name: /^PNG$/i })],
                ['button', page.getByRole('button', { name: /^PNG$/i })]
            ]);
            await pngChoice.click();
        }

        await expect
            .poll(async () => {
                if (await pngRadio.isVisible()) {
                    return await pngRadio.isChecked();
                }

                try {
                    return await formatControl.inputValue();
                } catch {
                    return (await formatControl.textContent()) ?? '';
                }
            })
            .toMatch(/true|PNG/i);
    }

    const exportButton = await pickVisible([
        ['export', page.getByRole('button', { name: /^Export$/i })],
        ['print', page.getByRole('button', { name: /^Print$/i })],
        ['download', page.getByRole('button', { name: /^Download$/i })],
        ['export-map', page.getByRole('button', { name: /^Export Map$/i })]
    ]);
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(1024);

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(Buffer.from(fileContent.subarray(0, 8)).equals(pngSignature)).toBe(true);

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('scale-bar')).toBeVisible();
});
