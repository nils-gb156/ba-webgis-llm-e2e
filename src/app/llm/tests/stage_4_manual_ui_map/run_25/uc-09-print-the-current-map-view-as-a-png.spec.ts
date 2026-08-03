// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
    getActiveBaseLayerTitle,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

    await expect
        .poll(async () => {
            const [temperatureVisible, uviStationsVisible, eucosStationsVisible] = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return temperatureVisible || uviStationsVisible || eucosStationsVisible;
        })
        .toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    const printToggle = page.getByTestId('print-toggle');

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();

    const printingContent = page.getByTestId('printing');
    const formContainer = (await printingContent.isVisible()) ? printingContent : printingPanel;

    const titleInput = formContainer.getByLabel(/title/i).first();
    await expect(titleInput).toBeVisible();

    const printTitle = 'E2E PNG Map Export';
    await titleInput.fill(printTitle);

    const pngRadio = formContainer.getByRole('radio', { name: 'PNG', exact: true }).first();
    const formatCombobox = formContainer.getByRole('combobox', { name: /format/i }).first();
    const pngButton = formContainer.getByRole('button', { name: 'PNG', exact: true }).first();

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await formatCombobox.isVisible()) {
        await formatCombobox.selectOption({ label: 'PNG' });
        await expect(formatCombobox).toHaveValue(/png/i);
    } else {
        await expect(pngButton).toBeVisible();
        await pngButton.click();
    }

    const exportButtonCandidates = [
        formContainer.getByRole('button', { name: 'Export', exact: true }).first(),
        formContainer.getByRole('button', { name: 'Print', exact: true }).first(),
        formContainer.getByRole('button', { name: 'Download', exact: true }).first(),
        formContainer.getByRole('button', { name: 'Print Map', exact: true }).first()
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if (await candidate.isVisible()) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileData = await readFile(downloadPath!);
    expect(fileData.length).toBeGreaterThan(1000);
    expect(Array.from(fileData.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
