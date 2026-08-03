// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(async () => {
        const activeBaseLayer = await getActiveBaseLayerTitle(page);
        return ['Carto Light', 'Carto Dark', 'OpenStreetMap'].includes(activeBaseLayer ?? '');
    }).toBe(true);

    await expect.poll(async () => {
        const renderedStates = await Promise.all([
            isLayerRendered(page, 'UV-Index'),
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'Precipitation'),
            isLayerRendered(page, 'Clouds'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return renderedStates.some(Boolean);
    }).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const labeledTitleInput = printingPanel.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInput.count()) > 0
            ? labeledTitleInput.first()
            : printingPanel.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E PNG Export');

    const labeledFormatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
    const unlabeledCombobox = printingPanel.getByRole('combobox');

    if ((await labeledFormatCombobox.count()) > 0 || (await unlabeledCombobox.count()) > 0) {
        const formatCombobox =
            (await labeledFormatCombobox.count()) > 0
                ? labeledFormatCombobox.first()
                : unlabeledCombobox.first();
        await expect(formatCombobox).toBeVisible();
        await formatCombobox.selectOption({ label: 'PNG' });
    } else {
        const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    }

    let exportButton = printingPanel.getByRole('button', { name: 'Export', exact: true });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Print', exact: true });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Export Map', exact: true });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Print Map', exact: true });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const downloadedFile = await download.path();
    expect(downloadedFile).not.toBeNull();

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(async () => {
        const activeBaseLayer = await getActiveBaseLayerTitle(page);
        return ['Carto Light', 'Carto Dark', 'OpenStreetMap'].includes(activeBaseLayer ?? '');
    }).toBe(true);
    await expect.poll(async () => {
        const renderedStates = await Promise.all([
            isLayerRendered(page, 'UV-Index'),
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'Precipitation'),
            isLayerRendered(page, 'Clouds'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return renderedStates.some(Boolean);
    }).toBe(true);
});
