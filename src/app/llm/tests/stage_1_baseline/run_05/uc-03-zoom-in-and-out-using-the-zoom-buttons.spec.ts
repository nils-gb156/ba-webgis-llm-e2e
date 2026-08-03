// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const zoomInButton = page.getByTitle('Zoom in', { exact: true });
    const zoomOutButton = page.getByTitle('Zoom out', { exact: true });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    const getMapZoom = async (): Promise<number | undefined> => {
        return await page.evaluate(() => {
            const isFiniteZoom = (value: unknown): value is number =>
                typeof value === 'number' && Number.isFinite(value);

            const getZoomFromCandidate = (candidate: any): number | undefined => {
                try {
                    if (!candidate || (typeof candidate !== 'object' && typeof candidate !== 'function')) {
                        return undefined;
                    }

                    if (typeof candidate.getView === 'function') {
                        const view = candidate.getView();
                        const zoom = view?.getZoom?.();
                        if (isFiniteZoom(zoom)) {
                            return zoom;
                        }
                    }
                } catch {
                    return undefined;
                }

                return undefined;
            };

            const preferredGlobals = [
                'map',
                'olMap',
                '__map',
                '__olMap',
                '__ol_map__',
                'openlayersMap',
                'openLayersMap'
            ];

            for (const key of preferredGlobals) {
                const zoom = getZoomFromCandidate((window as any)[key]);
                if (isFiniteZoom(zoom)) {
                    return zoom;
                }
            }

            for (const key of Object.getOwnPropertyNames(window)) {
                let value: unknown;
                try {
                    value = (window as any)[key];
                } catch {
                    continue;
                }

                const zoom = getZoomFromCandidate(value);
                if (isFiniteZoom(zoom)) {
                    return zoom;
                }
            }

            for (const element of Array.from(document.querySelectorAll('*'))) {
                const directZoom = getZoomFromCandidate(element);
                if (isFiniteZoom(directZoom)) {
                    return directZoom;
                }

                for (const key of Object.getOwnPropertyNames(element)) {
                    let value: unknown;
                    try {
                        value = (element as any)[key];
                    } catch {
                        continue;
                    }

                    const zoom = getZoomFromCandidate(value);
                    if (isFiniteZoom(zoom)) {
                        return zoom;
                    }
                }
            }

            return undefined;
        });
    };

    let initialZoom: number | undefined;
    await expect
        .poll(async () => {
            initialZoom = await getMapZoom();
            return initialZoom;
        })
        .not.toBeUndefined();

    if (initialZoom === undefined) {
        throw new Error('Could not determine the initial map zoom level.');
    }

    await zoomInButton.click();

    let zoomAfterZoomIn: number | undefined;
    await expect.poll(async () => {
        zoomAfterZoomIn = await getMapZoom();
        return zoomAfterZoomIn;
    }).toBeGreaterThan(initialZoom);

    if (zoomAfterZoomIn === undefined) {
        throw new Error('Could not determine the map zoom level after zooming in.');
    }

    await zoomOutButton.click();

    await expect.poll(async () => {
        return await getMapZoom();
    }).toBeLessThan(zoomAfterZoomIn);
});
