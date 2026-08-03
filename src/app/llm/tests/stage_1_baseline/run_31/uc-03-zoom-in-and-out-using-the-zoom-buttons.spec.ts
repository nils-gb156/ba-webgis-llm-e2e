// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type CapturedZoomRequest = {
    url: string;
    zoom: number;
};

function parseZoomValue(value: string | null): number | undefined {
    if (!value) {
        return undefined;
    }

    if (/^-?\d+$/.test(value)) {
        return Number.parseInt(value, 10);
    }

    const trailingNumberMatch = value.match(/(\d+)(?!.*\d)/);
    if (trailingNumberMatch) {
        return Number.parseInt(trailingNumberMatch[1], 10);
    }

    return undefined;
}

function extractZoomFromUrl(urlString: string): number | undefined {
    try {
        const url = new URL(urlString);

        for (const key of ['z', 'zoom']) {
            const zoom = parseZoomValue(url.searchParams.get(key));
            if (zoom !== undefined) {
                return zoom;
            }
        }

        for (const key of ['tilematrix', 'TileMatrix', 'TILEMATRIX']) {
            const zoom = parseZoomValue(url.searchParams.get(key));
            if (zoom !== undefined) {
                return zoom;
            }
        }

        const xyzMatch = url.pathname.match(/(?:^|\/)(\d+)\/\d+\/\d+(?:\.[a-z0-9]+)?$/i);
        if (xyzMatch) {
            return Number.parseInt(xyzMatch[1], 10);
        }

        return undefined;
    } catch {
        return undefined;
    }
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    const zoomRequests: CapturedZoomRequest[] = [];

    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (!['image', 'fetch', 'xhr'].includes(resourceType)) {
            return;
        }

        const zoom = extractZoomFromUrl(request.url());
        if (zoom === undefined) {
            return;
        }

        zoomRequests.push({
            url: request.url(),
            zoom
        });
    });

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const zoomInButton = page.getByRole('button', { name: /^(\+|Zoom in)$/ });
    const zoomOutButton = page.getByRole('button', { name: /^(-|–|−|Zoom out)$/ });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await page.waitForLoadState('networkidle');

    let initialZoom: number | undefined;
    await expect.poll(() => {
        const observedZooms = zoomRequests.map((request) => request.zoom);
        initialZoom = observedZooms.length > 0 ? Math.max(...observedZooms) : undefined;
        return initialZoom;
    }).toBeDefined();

    const requestCountBeforeZoomIn = zoomRequests.length;
    await zoomInButton.click();

    let zoomAfterZoomIn: number | undefined;
    await expect.poll(() => {
        const observedZooms = zoomRequests.slice(requestCountBeforeZoomIn).map((request) => request.zoom);
        zoomAfterZoomIn = observedZooms.length > 0 ? Math.max(...observedZooms) : undefined;
        return zoomAfterZoomIn;
    }).toBeGreaterThan(initialZoom!);

    await page.waitForLoadState('networkidle');

    const requestCountBeforeZoomOut = zoomRequests.length;
    await zoomOutButton.click();

    await expect.poll(() => {
        const observedZooms = zoomRequests.slice(requestCountBeforeZoomOut).map((request) => request.zoom);
        return observedZooms.length > 0 ? Math.min(...observedZooms) : undefined;
    }).toBeLessThan(zoomAfterZoomIn!);
});
