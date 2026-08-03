// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9 Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    await page.getByTestId('print-toggle').click();

    const textboxes = page.getByRole('textbox');
    let titleInputIndex = -1;
    await expect.poll(async () => {
        const count = await textboxes.count();
        for (let i = 0; i < count; i++) {
            const textbox = textboxes.nth(i);
            if (!(await textbox.isVisible())) {
                continue;
            }
            if ((await textbox.getAttribute('data-testid')) === 'geocoder-input') {
                continue;
            }
            titleInputIndex = i;
            return i;
        }
        return -1;
    }).not.toBe(-1);

    const titleInput = textboxes.nth(titleInputIndex);
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current Weather Map');

    let pngFormatSelected = false;

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible())) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
        pngFormatSelected = true;
    }

    if (!pngFormatSelected) {
        const pngButton = page.getByRole('button', { name: /^png$/i });
        for (let i = 0; i < (await pngButton.count()); i++) {
            const button = pngButton.nth(i);
            if (!(await button.isVisible())) {
                continue;
            }
            if ((await button.getAttribute('data-testid')) === 'print-toggle') {
                continue;
            }
            await button.click();
            pngFormatSelected = true;
            break;
        }
    }

    if (!pngFormatSelected) {
        let formatCombobox = page.getByRole('combobox', { name: /format/i }).first();
        let foundFormatCombobox = (await page.getByRole('combobox', { name: /format/i }).count()) > 0;

        if (!foundFormatCombobox || !(await formatCombobox.isVisible())) {
            const comboboxes = page.getByRole('combobox');
            for (let i = 0; i < (await comboboxes.count()); i++) {
                const combobox = comboboxes.nth(i);
                if (!(await combobox.isVisible())) {
                    continue;
                }

                const ariaLabel = (await combobox.getAttribute('aria-label')) ?? '';
                let currentValue = '';
                try {
                    currentValue = await combobox.inputValue();
                } catch {
                    currentValue = ((await combobox.textContent()) ?? '').trim();
                }

                if (/basemaps/i.test(ariaLabel) || /carto light/i.test(currentValue)) {
                    continue;
                }

                formatCombobox = combobox;
                foundFormatCombobox = true;
                break;
            }
        }

        expect(foundFormatCombobox).toBe(true);
        await expect(formatCombobox).toBeVisible();

        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.click();
            const pngOption = page.getByRole('option', { name: /^png$/i });
            await expect(pngOption.first()).toBeVisible();
            await pngOption.first().click();
        }

        await expect.poll(async () => {
            try {
                return await formatCombobox.inputValue();
            } catch {
                return ((await formatCombobox.textContent()) ?? '').trim();
            }
        }).toMatch(/png/i);

        pngFormatSelected = true;
    }

    expect(pngFormatSelected).toBe(true);

    const exportCandidates = [
        page.getByRole('button', { name: /^export$/i }),
        page.getByRole('button', { name: /^print$/i }),
        page.getByRole('button', { name: /^download$/i }),
        page.getByRole('button', { name: /^generate$/i }),
        page.getByRole('button', { name: /export map/i }),
        page.getByRole('button', { name: /print map/i })
    ];

    let exportButton = exportCandidates[0].first();
    let foundExportButton = false;

    for (const candidate of exportCandidates) {
        for (let i = 0; i < (await candidate.count()); i++) {
            const button = candidate.nth(i);
            if (!(await button.isVisible())) {
                continue;
            }
            if ((await button.getAttribute('data-testid')) === 'print-toggle') {
                continue;
            }
            exportButton = button;
            foundExportButton = true;
            break;
        }
        if (foundExportButton) {
            break;
        }
    }

    expect(foundExportButton).toBe(true);
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(1024);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
