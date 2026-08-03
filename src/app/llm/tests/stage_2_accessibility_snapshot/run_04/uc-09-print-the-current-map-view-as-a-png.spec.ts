// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    const getFirstVisibleLocator = async (candidates: Locator[], timeout = 10000): Promise<Locator> => {
        await expect
            .poll(
                async () => {
                    for (let index = 0; index < candidates.length; index += 1) {
                        if (await candidates[index].count()) {
                            const candidate = candidates[index].first();
                            if (await candidate.isVisible()) {
                                return index;
                            }
                        }
                    }
                    return -1;
                },
                { timeout }
            )
            .not.toBe(-1);

        for (const candidate of candidates) {
            if (await candidate.count()) {
                const first = candidate.first();
                if (await first.isVisible()) {
                    return first;
                }
            }
        }

        throw new Error('No visible locator found.');
    };

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await page.getByTestId('print-toggle').click();

    const titleInput = await getFirstVisibleLocator([
        page.getByRole('textbox', { name: 'Title', exact: true }),
        page.getByRole('textbox', { name: /map title/i }),
        page.getByRole('textbox', { name: /print title/i }),
        page.getByLabel('Title', { exact: true }),
        page.getByLabel(/map title/i),
        page.getByLabel(/print title/i),
        page.getByPlaceholder(/title/i),
    ]);

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');

    let pngSelected = false;
    const formatCandidates = [
        page.getByRole('combobox', { name: 'Format', exact: true }),
        page.getByRole('combobox', { name: /file format/i }),
        page.getByRole('combobox', { name: /output format/i }),
        page.getByLabel('Format', { exact: true }),
        page.getByLabel(/file format/i),
        page.getByLabel(/output format/i),
    ];

    for (const candidate of formatCandidates) {
        if (!(await candidate.count())) {
            continue;
        }

        const control = candidate.first();
        if (!(await control.isVisible())) {
            continue;
        }

        const tagName = await control.evaluate((element) => element.tagName.toLowerCase());

        if (tagName === 'select') {
            const pngValue = await control.evaluate((element) => {
                const select = element as HTMLSelectElement;
                const option = Array.from(select.options).find((entry) =>
                    /png/i.test(`${entry.label} ${entry.text} ${entry.value}`)
                );
                return option?.value ?? null;
            });

            expect(pngValue).not.toBeNull();
            await control.selectOption(pngValue!);
            pngSelected = true;
            break;
        }

        await control.click();
        const pngOption = await getFirstVisibleLocator(
            [
                page.getByRole('option', { name: 'PNG', exact: true }),
                page.getByRole('menuitemradio', { name: 'PNG', exact: true }),
            ],
            5000
        );
        await pngOption.click();
        pngSelected = true;
        break;
    }

    if (!pngSelected) {
        const pngRadio = await getFirstVisibleLocator([
            page.getByRole('radio', { name: 'PNG', exact: true }),
            page.getByLabel('PNG', { exact: true }),
        ]);
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    }

    expect(pngSelected).toBeTruthy();

    const exportButton = await getFirstVisibleLocator([
        page.getByRole('button', { name: 'Export', exact: true }),
        page.getByRole('button', { name: /^export\b/i }),
        page.getByRole('button', { name: 'Print', exact: true }),
        page.getByRole('button', { name: /^print$/i }),
        page.getByRole('button', { name: /^download\b/i }),
        page.getByRole('button', { name: /^generate\b/i }),
    ]);

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    await expect(download.failure()).resolves.toBeNull();

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBuffer = await readFile(downloadPath!);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
});
