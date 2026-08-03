// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const findVisibleCandidateIndex = async (candidates: Locator[]): Promise<number> => {
        for (let i = 0; i < candidates.length; i += 1) {
            try {
                if (await candidates[i].isVisible()) {
                    return i;
                }
            } catch {
                // ignore and continue with the next candidate
            }
        }
        return -1;
    };

    const waitForVisibleCandidateIndex = async (
        candidates: Locator[],
        description: string
    ): Promise<number> => {
        await expect
            .poll(() => findVisibleCandidateIndex(candidates), {
                message: `Expected ${description} to become visible`,
            })
            .not.toBe(-1);

        const index = await findVisibleCandidateIndex(candidates);
        if (index === -1) {
            throw new Error(`No visible candidate found for ${description}`);
        }
        return index;
    };

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');

    const titleInputCandidates: Locator[] = [
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel(/title/i),
        page.getByPlaceholder(/title/i),
        page.getByRole('textbox').nth(1),
    ];

    if ((await findVisibleCandidateIndex(titleInputCandidates)) === -1) {
        await printToggle.click();
    }

    const titleInputIndex = await waitForVisibleCandidateIndex(
        titleInputCandidates,
        'the print title input'
    );
    const titleInput = titleInputCandidates[titleInputIndex];

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Weather map export');
    await expect(titleInput).toHaveValue('Weather map export');

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    const pngOption = page.getByRole('option', { name: /^PNG$/i });
    const pngMenuItemRadio = page.getByRole('menuitemradio', { name: /^PNG$/i });
    const pngButton = page.getByRole('button', { name: /^PNG$/i });

    const directPngChoiceCandidates: Locator[] = [pngRadio, pngOption, pngMenuItemRadio, pngButton];

    if ((await findVisibleCandidateIndex(directPngChoiceCandidates)) !== -1) {
        if (await pngRadio.isVisible().catch(() => false)) {
            await pngRadio.click({ force: true });
            await expect(pngRadio).toBeChecked();
        } else {
            const pngChoiceIndex = await waitForVisibleCandidateIndex(
                directPngChoiceCandidates,
                'the PNG format option'
            );
            await directPngChoiceCandidates[pngChoiceIndex].click();
        }
    } else {
        const formatControlCandidates: Locator[] = [
            page.getByRole('combobox', { name: /format/i }),
            page.getByLabel(/format/i),
            page.getByRole('button', { name: /format/i }),
            page.getByRole('combobox').nth(1),
        ];

        const formatControlIndex = await waitForVisibleCandidateIndex(
            formatControlCandidates,
            'the print format control'
        );
        const formatControl = formatControlCandidates[formatControlIndex];

        await expect(formatControl).toBeVisible();

        const formatControlInfo = await formatControl.evaluate((element) => {
            if (element instanceof HTMLSelectElement) {
                return {
                    tagName: element.tagName.toLowerCase(),
                    options: Array.from(element.options).map((option) => ({
                        value: option.value,
                        label: option.label,
                        text: option.text,
                    })),
                };
            }

            return {
                tagName: element.tagName.toLowerCase(),
                options: [] as Array<{ value: string; label: string; text: string }>,
            };
        });

        if (formatControlInfo.tagName === 'select') {
            const pngSelectOption = formatControlInfo.options.find(
                (option) =>
                    /png/i.test(option.value) || /png/i.test(option.label) || /png/i.test(option.text)
            );

            expect(pngSelectOption).toBeDefined();
            if (!pngSelectOption) {
                throw new Error('No PNG option found in the print format select');
            }

            await formatControl.selectOption(pngSelectOption.value);

            await expect
                .poll(() =>
                    formatControl.evaluate((element) =>
                        element instanceof HTMLSelectElement
                            ? element.selectedOptions[0]?.textContent?.trim() ?? ''
                            : ''
                    )
                )
                .toMatch(/png/i);
        } else {
            await formatControl.click();

            const openedPngChoiceCandidates: Locator[] = [pngOption, pngMenuItemRadio, pngRadio, pngButton];
            const pngChoiceIndex = await waitForVisibleCandidateIndex(
                openedPngChoiceCandidates,
                'the PNG format option after opening the format control'
            );
            const pngChoice = openedPngChoiceCandidates[pngChoiceIndex];

            if (pngChoice === pngRadio) {
                await pngRadio.click({ force: true });
                await expect(pngRadio).toBeChecked();
            } else {
                await pngChoice.click();
            }
        }
    }

    const exportButtonCandidates: Locator[] = [
        page.getByRole('button', { name: /^Export$/i }),
        page.getByRole('button', { name: /^Export Map$/i }),
        page.getByRole('button', { name: /^Print$/i }),
        page.getByRole('button', { name: /^Download$/i }),
        page.getByRole('button', { name: /^Generate$/i }),
        page.getByRole('button', { name: /^Create$/i }),
    ];

    const exportButtonIndex = await waitForVisibleCandidateIndex(
        exportButtonCandidates,
        'the print export button'
    );
    const exportButton = exportButtonCandidates[exportButtonIndex];

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
    if (!stream) {
        throw new Error('Expected a downloadable PNG stream');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileBuffer = Buffer.concat(chunks);

    expect(fileBuffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(fileBuffer.byteLength).toBeGreaterThan(10_000);

    const pngWidth = fileBuffer.readUInt32BE(16);
    const pngHeight = fileBuffer.readUInt32BE(20);

    expect(pngWidth).toBeGreaterThan(100);
    expect(pngHeight).toBeGreaterThan(100);
});
