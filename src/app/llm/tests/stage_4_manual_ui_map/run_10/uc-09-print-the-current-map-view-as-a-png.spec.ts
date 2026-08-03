// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect
        .poll(async () => (await getActiveBaseLayerTitle(page)) ?? '')
        .toMatch(/^(Carto Light|Carto Dark|OpenStreetMap)$/);

    await expect
        .poll(async () => {
            const renderedStates = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations'),
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds')
            ]);
            return renderedStates.some(Boolean);
        })
        .toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible())) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();
    const printing = printingPanel.getByTestId('printing');
    await expect(printing).toBeVisible();

    const titleInput = printing.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    const printTitle = 'E2E PNG map export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printing.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = printing.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) > 0) {
            await expect(formatCombobox).toBeVisible();
            const isNativeSelect = await formatCombobox.evaluate(
                (element) => element.tagName.toLowerCase() === 'select'
            );

            if (isNativeSelect) {
                await formatCombobox.selectOption({ label: 'PNG' });
                await expect(formatCombobox).toHaveValue(/png/i);
            } else {
                await formatCombobox.click();
                const pngOption = page.getByRole('option', { name: /^PNG$/i });
                await expect(pngOption).toBeVisible();
                await pngOption.click();
            }
        } else {
            const pngButton = printing.getByRole('button', { name: /^PNG$/i });
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    let exportButton = printing.getByRole('button', { name: /^Export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /^Print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /^Download$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /^Generate$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /^Create Printout$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /^Export Map$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /^Print Map$/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();
});
