// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect
        .poll(async () => {
            const activeBaseLayer = await getActiveBaseLayerTitle(page);
            return (
                activeBaseLayer !== undefined &&
                ['Carto Light', 'Carto Dark', 'OpenStreetMap'].includes(activeBaseLayer)
            );
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const renderedStates = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return renderedStates.some(Boolean);
        })
        .toBe(true);

    const isPrintingPanelVisible = await printingPanel.isVisible();
    const printTogglePressed = await printToggle.getAttribute('aria-pressed');
    if (!isPrintingPanelVisible) {
        if (printTogglePressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    const printTitle = 'Playwright PNG Export';
    const labeledTitleInput = printingPanel.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInput.count()) > 0
            ? labeledTitleInput.first()
            : printingPanel.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    let pngSelected = false;
    const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    } else {
        const labeledFormatControl = printingPanel.getByLabel(/format/i);
        const formatControl =
            (await labeledFormatControl.count()) > 0
                ? labeledFormatControl.first()
                : printingPanel.getByRole('combobox').first();

        await expect(formatControl).toBeVisible();
        const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());

        if (tagName === 'select') {
            const optionAttempts: ({ label: string } | { value: string })[] = [
                { label: 'PNG' },
                { value: 'png' },
                { value: 'PNG' },
                { label: 'image/png' },
                { value: 'image/png' }
            ];

            for (const option of optionAttempts) {
                try {
                    await formatControl.selectOption(option);
                    pngSelected = true;
                    break;
                } catch {
                    // try next option mapping
                }
            }

            await expect
                .poll(async () => {
                    return await formatControl.evaluate((element) => {
                        if (element instanceof HTMLSelectElement) {
                            return element.selectedOptions[0]?.textContent?.trim() ?? '';
                        }
                        return '';
                    });
                })
                .toMatch(/png/i);
        } else {
            await formatControl.click();

            const popupCandidates = [
                page.getByRole('option', { name: /^PNG$/i }),
                page.getByRole('menuitemradio', { name: /^PNG$/i }),
                page.getByRole('radio', { name: /^PNG$/i })
            ];

            for (const candidate of popupCandidates) {
                if ((await candidate.count()) > 0) {
                    await candidate.first().click({ force: true });
                    pngSelected = true;
                    break;
                }
            }
        }
    }

    expect(pngSelected).toBe(true);

    const exportButtonCandidates = [
        printingPanel.getByRole('button', { name: 'Export', exact: true }),
        printingPanel.getByRole('button', { name: 'Print', exact: true }),
        printingPanel.getByRole('button', { name: 'Download', exact: true })
    ];

    let exportButton = printingPanel.getByRole('button').last();
    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();

    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileBuffer = Buffer.concat(chunks);
    expect(fileBuffer.byteLength).toBeGreaterThan(1000);
    expect(fileBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
});
