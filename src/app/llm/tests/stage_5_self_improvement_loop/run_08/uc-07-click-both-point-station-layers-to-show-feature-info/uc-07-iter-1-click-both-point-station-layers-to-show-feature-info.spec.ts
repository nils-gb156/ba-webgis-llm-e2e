// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect(mapContainer).toBeVisible();
    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(0);

    if (!(await infoPanel.isVisible())) {
        const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (infoPanelPressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').not.toBe('true');

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await page.waitForLoadState('networkidle');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const clickPosition = await page.evaluate(([x, y]) => {
        const map = (
            globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coordinate: [number, number]) => [number, number] | undefined;
                    };
                };
            }
        ).__openPioneerMap;

        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        if (!Array.isArray(pixel) || pixel.length < 2) {
            return undefined;
        }

        return { x: pixel[0], y: pixel[1] };
    }, targetCoordinate);

    if (!clickPosition) {
        throw new Error('Could not determine map pixel for target coordinate [1188692.84, 6767643.28].');
    }

    const uviSection = page.getByTestId('uvi-station-section');
    const uviInfo = page.getByTestId('uvi-station-info');
    const eucosSectionTitle = infoPanel.getByText('EUCOS Ground Station', { exact: true });

    const offsets: Array<[number, number]> = [
        [0, 0],
        [0, 2],
        [0, -2],
        [2, 0],
        [-2, 0],
        [2, 2],
        [-2, 2],
        [2, -2],
        [-2, -2]
    ];

    let foundBothSections = false;

    for (const [dx, dy] of offsets) {
        await mapContainer.click({
            position: {
                x: clickPosition.x + dx,
                y: clickPosition.y + dy
            }
        });

        await expect(uviSection).toBeVisible();

        try {
            await expect.poll(
                async () => {
                    const text = (await infoPanel.textContent()) ?? '';
                    return text.includes('UV-Index Station') && text.includes('EUCOS Ground Station');
                },
                { timeout: 4000 }
            ).toBe(true);

            foundBothSections = true;
            break;
        } catch {
            // Try a very small neighboring pixel offset. The target location is fixed,
            // but overlapping point symbols can require a slightly different hit pixel.
        }
    }

    expect(foundBothSections).toBe(true);

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
    await expect(uviSection).toBeVisible();
    await expect(uviInfo).toContainText('Identifier');
    await expect(eucosSectionTitle).toBeVisible();
    await expect.poll(async () => {
        const text = (await infoPanel.textContent()) ?? '';
        const marker = 'EUCOS Ground Station';
        const index = text.indexOf(marker);
        return index === -1 ? '' : text.slice(index + marker.length).trim();
    }).not.toBe('');
});
