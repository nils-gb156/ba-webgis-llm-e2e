// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    let titleInput = page.getByRole('textbox', { name: /title/i });
    if (!(await titleInput.isVisible().catch(() => false))) {
        titleInput = page.getByLabel(/title/i);
    }
    if (!(await titleInput.isVisible().catch(() => false))) {
        titleInput = page.getByPlaceholder(/title/i);
    }

    if (!(await titleInput.isVisible().catch(() => false))) {
        await page.getByTestId('print-toggle').click();
    }

    if (!(await titleInput.isVisible().catch(() => false))) {
        titleInput = page.getByRole('textbox', { name: /title/i });
    }
    if (!(await titleInput.isVisible().catch(() => false))) {
        titleInput = page.getByLabel(/title/i);
    }
    if (!(await titleInput.isVisible().catch(() => false))) {
        titleInput = page.getByPlaceholder(/title/i);
    }

    await expect(titleInput).toBeVisible();

    const printTitle = `Map export ${Date.now()}`;
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    const pngButton = page.getByRole('button', { name: /^png$/i });
    const pngOption = page.getByRole('option', { name: /^png$/i });

    if (await formatCombobox.isVisible().catch(() => false)) {
        await expect(formatCombobox).toBeVisible();

        const pngValue = await formatCombobox.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                const option = Array.from(element.options).find(
                    (entry) =>
                        /png/i.test(entry.label) ||
                        /png/i.test(entry.text) ||
                        /png/i.test(entry.value)
                );
                return option?.value;
            }
            return undefined;
        });

        if (pngValue) {
            await formatCombobox.selectOption(pngValue);
        } else {
            await formatCombobox.click();
            if (await pngOption.isVisible().catch(() => false)) {
                await pngOption.click();
            } else if (await pngButton.isVisible().catch(() => false)) {
                await pngButton.click();
            } else {
                throw new Error('PNG format option not found in the print panel.');
            }
        }

        await expect
            .poll(async () => {
                return await formatCombobox.evaluate((element) => {
                    if (element instanceof HTMLSelectElement) {
                        return element.selectedOptions[0]?.textContent?.trim() ?? '';
                    }
                    return element.textContent?.trim() ?? '';
                });
            })
            .toMatch(/png/i);
    } else if (await pngRadio.isVisible().catch(() => false)) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.isVisible().catch(() => false)) {
        await pngButton.click();
        await expect(pngButton).toBeVisible();
    } else {
        throw new Error('No control for selecting PNG format was found in the print panel.');
    }

    let exportButton = page.getByRole('button', { name: /^export$/i });
    if (!(await exportButton.isVisible().catch(() => false))) {
        exportButton = page.getByRole('button', { name: /^print$/i });
    }
    if (!(await exportButton.isVisible().catch(() => false))) {
        exportButton = page.getByRole('button', { name: /download/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(download.suggestedFilename()).toMatch(/\.png$/i);
    await expect(await download.failure()).toBeNull();

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('The PNG export download did not provide a local file path.');
    }

    const fileBuffer = await readFile(downloadPath);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(fileBuffer.toString('ascii', 12, 16)).toBe('IHDR');
    expect(fileBuffer.readUInt32BE(16)).toBeGreaterThan(200);
    expect(fileBuffer.readUInt32BE(20)).toBeGreaterThan(200);
    expect(fileBuffer.byteLength).toBeGreaterThan(1000);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
