// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    let clickPosition: { x: number; y: number } | undefined;

    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                const size = map?.olMap?.getSize?.();

                if (!pixel || !size || pixel.length < 2 || size.length < 2) {
                    return undefined;
                }

                const [px, py] = pixel;
                if (typeof px !== 'number' || typeof py !== 'number') {
                    return undefined;
                }

                if (px < 0 || py < 0 || px > size[0] || py > size[1]) {
                    return undefined;
                }

                return { x: Math.round(px), y: Math.round(py) };
            }, targetCoordinate);

            return clickPosition;
        }, { timeout: 10000 })
        .not.toBeUndefined();

    await mapContainer.click({ position: clickPosition! });

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            return coordinate ? [Math.round(coordinate[0]), Math.round(coordinate[1])] : undefined;
        }, { timeout: 10000 })
        .toEqual([1188693, 6767643]);

    const uviSection = page.getByTestId('uvi-station-section');
    const uviInfo = page.getByTestId('uvi-station-info');

    await expect(uviSection).toContainText('UV-Index Station', { timeout: 20000 });
    await expect(uviInfo).toContainText(/Identifier|Name|Alias|Country/, { timeout: 20000 });

    await expect
        .poll(async () => {
            await infoPanel.evaluate((element) => {
                element.scrollTop = element.scrollHeight;
            });
            return await infoPanel.innerText();
        }, { timeout: 20000 })
        .toMatch(/EUCOS Ground Station/);
});
