// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    if ((await printToggle.getAttribute('aria-pressed')) !== 'true') {
        await printToggle.click();
    }

    const titleInput = page.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    const formatCombobox = page.getByRole('combobox', { name: /format/i });

    await expect
        .poll(async () => (await pngRadio.isVisible()) || (await formatCombobox.isVisible()))
        .toBe(true);

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        await expect(formatCombobox).toBeVisible();
        const tagName = await formatCombobox.evaluate((element) => element.tagName.toUpperCase());

        if (tagName === 'SELECT') {
            const pngValue = await formatCombobox.evaluate((element) => {
                if (!(element instanceof HTMLSelectElement)) {
                    return undefined;
                }

                const option = Array.from(element.options).find(
                    (entry) =>
                        /png/i.test(entry.label) ||
                        /png/i.test(entry.textContent ?? '') ||
                        /png/i.test(entry.value)
                );
                return option?.value;
            });

            expect(pngValue).toBeTruthy();
            await formatCombobox.selectOption(pngValue!);

            await expect
                .poll(async () =>
                    formatCombobox.evaluate((element) => {
                        if (!(element instanceof HTMLSelectElement)) {
                            return '';
                        }
                        return element.selectedOptions[0]?.textContent?.trim() ?? '';
                    })
                )
                .toMatch(/png/i);
        } else {
            await formatCombobox.click();

            const pngOption = page.getByRole('option', { name: /^PNG$/i });
            if (await pngOption.isVisible()) {
                await pngOption.click();
            } else {
                const pngButton = page.getByRole('button', { name: /^PNG$/i });
                await expect(pngButton).toBeVisible();
                await pngButton.click();
            }
        }
    }

    const exportButtonCandidates = [
        page.getByRole('button', { name: /^Export$/i }),
        page.getByRole('button', { name: /^Print$/i }),
        page.getByRole('button', { name: /^Download$/i })
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if (await candidate.isVisible()) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(async () => await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    if (!downloadedPath) {
        throw new Error('Download path is not available.');
    }

    const fileContent = await readFile(downloadedPath);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(fileContent.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(fileContent.length).toBeGreaterThan(1000);
});
