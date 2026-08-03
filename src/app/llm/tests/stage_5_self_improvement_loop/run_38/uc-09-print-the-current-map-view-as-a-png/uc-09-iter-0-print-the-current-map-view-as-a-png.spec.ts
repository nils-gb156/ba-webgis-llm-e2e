// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    const waitForAnyVisible = async (locators: Locator[]): Promise<Locator> => {
        await expect
            .poll(async () => {
                for (let i = 0; i < locators.length; i++) {
                    if (await locators[i].isVisible().catch(() => false)) {
                        return i;
                    }
                }
                return -1;
            })
            .not.toBe(-1);

        for (const locator of locators) {
            if (await locator.isVisible().catch(() => false)) {
                return locator;
            }
        }

        return locators[0];
    };

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            return (
                (await isLayerRendered(page, 'Temperature')) ||
                (await isLayerRendered(page, 'EUCOS Ground Stations')) ||
                (await isLayerRendered(page, 'UV-Index Stations'))
            );
        })
        .toBe(true);

    await expect(page.getByTestId('scale-bar')).toBeVisible();

    const printToggle = page.getByTestId('print-toggle');
    await expect(printToggle).toBeVisible();
    await printToggle.click();

    const titleInput = await waitForAnyVisible([
        page.getByRole('textbox', { name: /title/i }).first(),
        page.getByLabel(/title/i).first()
    ]);
    await expect(titleInput).toBeVisible();

    const printTitle = 'UC9 PNG export';
    await titleInput.fill(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^png$/i }).first();
    const formatCombobox = page.getByRole('combobox', { name: /format/i }).first();
    const formatButton = page.getByRole('button', { name: /format/i }).first();

    if (await pngRadio.isVisible().catch(() => false)) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await formatCombobox.isVisible().catch(() => false)) {
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.click();
            const pngChoice = await waitForAnyVisible([
                page.getByRole('option', { name: /^png$/i }).first(),
                page.getByRole('menuitemradio', { name: /^png$/i }).first(),
                page.getByRole('button', { name: /^png$/i }).first()
            ]);
            await pngChoice.click();
        }
    } else if (await formatButton.isVisible().catch(() => false)) {
        await formatButton.click();
        const pngChoice = await waitForAnyVisible([
            page.getByRole('option', { name: /^png$/i }).first(),
            page.getByRole('menuitemradio', { name: /^png$/i }).first(),
            page.getByRole('button', { name: /^png$/i }).first()
        ]);
        await pngChoice.click();
    } else {
        const pngChoice = await waitForAnyVisible([
            page.getByRole('option', { name: /^png$/i }).first(),
            page.getByRole('menuitemradio', { name: /^png$/i }).first(),
            page.getByRole('button', { name: /^png$/i }).first()
        ]);
        await pngChoice.click();
    }

    const exportButton = await waitForAnyVisible([
        page.getByRole('button', { name: /^export$/i }).first(),
        page.getByRole('button', { name: /^print$/i }).first(),
        page.getByRole('button', { name: /^download$/i }).first(),
        page.getByRole('button', { name: /^generate$/i }).first()
    ]);
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(downloadPath);

    const fileBuffer = await readFile(downloadPath);
    expect(fileBuffer.byteLength).toBeGreaterThan(1024);
    expect(fileBuffer.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
});
