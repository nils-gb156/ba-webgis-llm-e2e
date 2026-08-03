// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();

    const printTitle = 'Current Weather Map';

    const titleInputCandidates = [
        printingPanel.getByRole('textbox', { name: /title/i }),
        printingPanel.getByLabel(/title/i),
        printingPanel.getByPlaceholder(/title/i),
        printingPanel.getByRole('textbox')
    ];

    let titleInput: Locator | undefined;
    for (const candidate of titleInputCandidates) {
        if ((await candidate.count()) > 0) {
            titleInput = candidate.first();
            break;
        }
    }

    expect(titleInput, 'Expected a title input in the printing panel.').toBeDefined();
    await expect(titleInput!).toBeVisible();
    await titleInput!.fill(printTitle);
    await expect(titleInput!).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelectCandidates = [
            printingPanel.getByRole('combobox', { name: /format/i }),
            printingPanel.getByLabel(/format/i),
            printingPanel.getByRole('combobox')
        ];

        let formatSelect: Locator | undefined;
        for (const candidate of formatSelectCandidates) {
            if ((await candidate.count()) > 0) {
                formatSelect = candidate.first();
                break;
            }
        }

        expect(formatSelect, 'Expected a file format control in the printing panel.').toBeDefined();
        await expect(formatSelect!).toBeVisible();

        try {
            await formatSelect!.selectOption({ label: 'PNG' });
        } catch {
            await formatSelect!.selectOption('png');
        }

        await expect(formatSelect!).toHaveValue(/png/i);
    }

    const exportButtonCandidates = [
        printingPanel.getByRole('button', { name: /^Export$/i }),
        printingPanel.getByRole('button', { name: /^Print$/i }),
        printingPanel.getByRole('button', { name: /export/i }),
        printingPanel.getByRole('button', { name: /print/i })
    ];

    let exportButton: Locator | undefined;
    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate.first();
            break;
        }
    }

    expect(exportButton, 'Expected an export/print button in the printing panel.').toBeDefined();
    await expect(exportButton!).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton!.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const savedFile = testInfo.outputPath(suggestedFilename);
    await download.saveAs(savedFile);

    const fileContent = await readFile(savedFile);
    expect(fileContent.length).toBeGreaterThan(100);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
