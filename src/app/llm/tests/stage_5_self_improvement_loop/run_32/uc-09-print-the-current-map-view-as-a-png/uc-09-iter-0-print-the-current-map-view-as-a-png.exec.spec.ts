// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import type { Locator, Page } from '../../../failure-snapshot-fixture';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
    const waitForVisibleCandidate = async (
        candidates: Array<{ kind: string; locator: Locator }>,
        description: string
    ): Promise<{ kind: string; locator: Locator }> => {
        for (const candidate of candidates) {
            try {
                await expect(candidate.locator.first(), `Expected ${description} to become visible`).toBeVisible({
                    timeout: 3000
                });
                return { kind: candidate.kind, locator: candidate.locator.first() };
            } catch {
                // try next candidate
            }
        }
        throw new Error(`Could not find a visible ${description}.`);
    };

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    await page.getByTestId('print-toggle').click();

    const titleFieldCandidate = await waitForVisibleCandidate(
        [
            { kind: 'named-textbox', locator: page.getByRole('textbox', { name: /title/i }) },
            { kind: 'labelled-input', locator: page.getByLabel(/title/i) },
            { kind: 'second-textbox', locator: page.getByRole('textbox').nth(1) }
        ],
        'print title input'
    );
    const titleInput = titleFieldCandidate.locator;
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');

    let printPanel: Page | Locator = page;
    const dialogWithTitle = page.getByRole('dialog').filter({ has: titleInput });
    if (await dialogWithTitle.first().isVisible().catch(() => false)) {
        printPanel = dialogWithTitle.first();
    }

    const formatCandidate = await waitForVisibleCandidate(
        [
            { kind: 'png-radio', locator: printPanel.getByRole('radio', { name: /^PNG$/i }) },
            { kind: 'png-tab', locator: printPanel.getByRole('tab', { name: /^PNG$/i }) },
            { kind: 'png-button', locator: printPanel.getByRole('button', { name: /^PNG$/i }) },
            { kind: 'format-combobox', locator: printPanel.getByRole('combobox', { name: /format/i }) },
            { kind: 'format-labelled', locator: printPanel.getByLabel(/format/i) }
        ],
        'PNG format control'
    );

    if (formatCandidate.kind === 'png-radio') {
        await formatCandidate.locator.click({ force: true });
        await expect(formatCandidate.locator).toBeChecked();
    } else if (formatCandidate.kind === 'png-tab' || formatCandidate.kind === 'png-button') {
        await formatCandidate.locator.click();
    } else {
        const tagName = await formatCandidate.locator.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            try {
                await formatCandidate.locator.selectOption({ label: 'PNG' });
            } catch {
                try {
                    await formatCandidate.locator.selectOption({ value: 'png' });
                } catch {
                    await formatCandidate.locator.selectOption({ value: 'image/png' });
                }
            }
            expect((await formatCandidate.locator.inputValue()).toLowerCase()).toContain('png');
        } else {
            await formatCandidate.locator.click();
            const pngOption = await waitForVisibleCandidate(
                [
                    { kind: 'png-option-exact', locator: page.getByRole('option', { name: /^PNG$/i }) },
                    { kind: 'png-option-generic', locator: page.getByRole('option', { name: /png/i }) }
                ],
                'PNG format option'
            );
            await pngOption.locator.click();
        }
    }

    const exportButtonCandidate = await waitForVisibleCandidate(
        [
            { kind: 'export', locator: printPanel.getByRole('button', { name: /^Export$/i }) },
            { kind: 'print', locator: printPanel.getByRole('button', { name: /^Print$/i }) },
            { kind: 'download', locator: printPanel.getByRole('button', { name: /^Download$/i }) },
            { kind: 'export-map', locator: printPanel.getByRole('button', { name: /^Export Map$/i }) }
        ],
        'print export button'
    );

    const downloadPromise = page.waitForEvent('download');
    await exportButtonCandidate.locator.click();

    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const savedFile = testInfo.outputPath(suggestedFilename);
    await download.saveAs(savedFile);

    const fileBuffer = await fs.readFile(savedFile);
    expect(fileBuffer.length).toBeGreaterThan(0);
    expect(fileBuffer.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
