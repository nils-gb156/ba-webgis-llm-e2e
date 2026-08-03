// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByRole('button', { name: 'Print Map', exact: true });

    const titleCandidates = [
        page.getByLabel(/^Title$/i).first(),
        page.getByRole('textbox', { name: /^Title$/i }).first(),
        page.getByLabel(/title/i).first(),
        page.getByRole('textbox', { name: /title/i }).first(),
        page.getByPlaceholder(/title/i).first()
    ];

    let titleInput = titleCandidates[0];
    let titleInputVisible = false;

    for (const candidate of titleCandidates) {
        if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
            titleInput = candidate;
            titleInputVisible = true;
            break;
        }
    }

    if (!titleInputVisible) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }

        for (const candidate of titleCandidates) {
            if ((await candidate.count()) > 0) {
                titleInput = candidate;
                break;
            }
        }
    }

    await expect(titleInput).toBeVisible();

    const printTitle = `Playwright PNG export ${Date.now()}`;
    await titleInput.fill(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^png$/i }).first();
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelectCandidates = [
            page.getByLabel(/^Format$/i).first(),
            page.getByLabel(/format/i).first(),
            page.getByRole('combobox', { name: /^Format$/i }).first(),
            page.getByRole('combobox', { name: /format/i }).first()
        ];

        let formatSelect = formatSelectCandidates[0];
        for (const candidate of formatSelectCandidates) {
            if ((await candidate.count()) > 0) {
                formatSelect = candidate;
                break;
            }
        }

        await expect(formatSelect).toBeVisible();

        let pngSelected = false;
        for (const option of [
            { label: 'PNG' },
            { label: 'png' },
            { value: 'png' },
            { value: 'image/png' }
        ]) {
            try {
                await formatSelect.selectOption(option);
                pngSelected = true;
                break;
            } catch {
                // try next option variant
            }
        }

        expect(pngSelected).toBe(true);
        await expect.poll(() =>
            formatSelect.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim() ?? select.value;
            })
        ).toMatch(/png/i);
    }

    const exportButtonCandidates = [
        page.getByRole('button', { name: /^Export$/i }).first(),
        page.getByRole('button', { name: /^Export Map$/i }).first(),
        page.getByRole('button', { name: /^Download$/i }).first(),
        page.getByRole('button', { name: /^Create Print$/i }).first(),
        page.getByRole('button', { name: /^Print$/i }).first()
    ];

    let exportButton = exportButtonCandidates[0];
    let exportButtonFound = false;

    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0 && (await candidate.isVisible())) {
            exportButton = candidate;
            exportButtonFound = true;
            break;
        }
    }

    expect(exportButtonFound).toBe(true);
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('Download path is unavailable.');
    }

    const fileContent = await readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
