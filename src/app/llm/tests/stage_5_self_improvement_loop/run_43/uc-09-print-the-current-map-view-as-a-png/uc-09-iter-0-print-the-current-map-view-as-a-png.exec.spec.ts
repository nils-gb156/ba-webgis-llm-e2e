// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const hasVisibleCandidate = async (candidates: any[]) => {
        for (const candidate of candidates) {
            if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
                return true;
            }
        }
        return false;
    };

    const firstVisibleCandidate = async (candidates: any[]) => {
        for (const candidate of candidates) {
            if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
                return candidate.first();
            }
        }
        return null;
    };

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => {
        const renderedStates = await Promise.all([
            isLayerRendered(page, 'EUCOS Ground Stations'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'Temperature')
        ]);
        return renderedStates.some(Boolean);
    }).toBe(true);

    await page.getByTestId('print-toggle').click();

    const titleCandidates = [
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel(/title/i),
        page.getByPlaceholder(/title/i)
    ];

    await expect.poll(async () => hasVisibleCandidate(titleCandidates)).toBe(true);
    const titleInput = await firstVisibleCandidate(titleCandidates);
    if (!titleInput) {
        throw new Error('Printing panel did not show a visible title input.');
    }

    await expect(titleInput).toBeVisible();
    const printTitle = 'Use Case 9 PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    const formatCandidates = [
        page.getByRole('combobox', { name: /format/i }),
        page.getByLabel(/format/i)
    ];

    await expect
        .poll(async () => {
            if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible())) {
                return 'radio';
            }
            if (await hasVisibleCandidate(formatCandidates)) {
                return 'select';
            }
            return '';
        })
        .not.toBe('');

    if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible())) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelect = await firstVisibleCandidate(formatCandidates);
        if (!formatSelect) {
            throw new Error('Printing panel did not show a visible format control.');
        }

        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' });
        await expect.poll(async () => (await formatSelect.inputValue()).toLowerCase()).toMatch(/png/);
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(async () => {
        const renderedStates = await Promise.all([
            isLayerRendered(page, 'EUCOS Ground Stations'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'Temperature')
        ]);
        return renderedStates.some(Boolean);
    }).toBe(true);

    const exportButtonCandidates = [
        page.getByRole('button', { name: /^export$/i }),
        page.getByRole('button', { name: /^print$/i }),
        page.getByRole('button', { name: /^download$/i })
    ];

    await expect.poll(async () => hasVisibleCandidate(exportButtonCandidates)).toBe(true);
    const exportButton = await firstVisibleCandidate(exportButtonCandidates);
    if (!exportButton) {
        throw new Error('Printing panel did not show a visible export button.');
    }

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBytes = await fs.readFile(downloadPath!);
    expect(fileBytes.length).toBeGreaterThan(8);
    expect(Array.from(fileBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
