// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type ZoomSignal = {
    strategy: 'level' | 'bbox';
    score: number;
};

type CapturedSignal = {
    timestamp: number;
    signal: ZoomSignal;
};

function median(values: number[]): number | undefined {
    if (values.length === 0) {
        return undefined;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

function parseNumericSegment(segment: string): number | undefined {
    const cleaned = segment.replace(/\.[^/.]+$/, '');
    if (/^-?\d+(?:\.\d+)?$/.test(cleaned)) {
        const value = Number(cleaned);
        if (Number.isFinite(value)) {
            return value;
        }
    }
    return undefined;
}

function parseZoomSignalFromUrl(url: string): ZoomSignal | undefined {
    try {
        const parsed = new URL(url);

        for (const key of ['z', 'zoom', 'ZOOM', 'level', 'LEVEL', 'tilematrix', 'TileMatrix', 'TILEMATRIX']) {
            const value = parsed.searchParams.get(key);
            if (!value) {
                continue;
            }

            const match = value.match(/-?\d+(?:\.\d+)?$/);
            if (match) {
                const numericValue = Number(match[0]);
                if (Number.isFinite(numericValue)) {
                    return { strategy: 'level', score: numericValue };
                }
            }
        }

        const bboxKey = Array.from(parsed.searchParams.keys()).find((key) => key.toLowerCase() === 'bbox');
        if (bboxKey) {
            const bboxValue = parsed.searchParams.get(bboxKey);
            if (bboxValue) {
                const parts = bboxValue.split(',').map((part) => Number(part.trim()));
                if (parts.length === 4 && parts.every((part) => Number.isFinite(part))) {
                    const [minX, minY, maxX, maxY] = parts;
                    const span = Math.abs(maxX - minX) + Math.abs(maxY - minY);
                    if (span > 0) {
                        return { strategy: 'bbox', score: -Math.log(span) };
                    }
                }
            }
        }

        const segments = parsed.pathname.split('/').filter(Boolean).map((segment) => segment.trim());
        for (let index = 0; index <= segments.length - 3; index++) {
            const z = parseNumericSegment(segments[index]);
            const x = parseNumericSegment(segments[index + 1]);
            const y = parseNumericSegment(segments[index + 2]);

            if (z !== undefined && x !== undefined && y !== undefined) {
                return { strategy: 'level', score: z };
            }
        }
    } catch {
        return undefined;
    }

    return undefined;
}

function pickRepresentativeSignal(signals: ZoomSignal[], preferredStrategy?: ZoomSignal['strategy']): ZoomSignal | undefined {
    const recentSignals = signals.slice(-50);

    if (preferredStrategy) {
        const preferredSignals = recentSignals.filter((signal) => signal.strategy === preferredStrategy);
        const preferredScore = median(preferredSignals.map((signal) => signal.score));
        if (preferredScore !== undefined) {
            return { strategy: preferredStrategy, score: preferredScore };
        }
    }

    const levelSignals = recentSignals.filter((signal) => signal.strategy === 'level');
    const bboxSignals = recentSignals.filter((signal) => signal.strategy === 'bbox');

    const dominantStrategy = levelSignals.length >= bboxSignals.length ? 'level' : 'bbox';
    const dominantSignals = dominantStrategy === 'level' ? levelSignals : bboxSignals;
    const dominantScore = median(dominantSignals.map((signal) => signal.score));

    if (dominantScore === undefined) {
        return undefined;
    }

    return { strategy: dominantStrategy, score: dominantScore };
}

async function getPerformanceResourceUrls(page: Parameters<typeof test>[0]['page']): Promise<string[]> {
    return await page.evaluate(() =>
        performance
            .getEntriesByType('resource')
            .map((entry) => entry.name)
            .filter((name): name is string => typeof name === 'string' && name.length > 0)
    );
}

async function findZoomLevel(page: Parameters<typeof test>[0]['page']): Promise<number | undefined> {
    return await page.evaluate(() => {
        const visited = new WeakSet<object>();
        const queue: Array<{ value: unknown; depth: number }> = [];

        const enqueue = (value: unknown, depth: number): void => {
            if (value === null || value === undefined) {
                return;
            }

            const valueType = typeof value;
            if (valueType !== 'object' && valueType !== 'function') {
                return;
            }

            if (depth > 2) {
                return;
            }

            const objectValue = value as object;
            if (visited.has(objectValue)) {
                return;
            }

            visited.add(objectValue);
            queue.push({ value, depth });
        };

        const tryReadZoom = (candidate: unknown): number | undefined => {
            try {
                if (
                    candidate &&
                    (typeof candidate === 'object' || typeof candidate === 'function') &&
                    'getView' in candidate &&
                    typeof (candidate as { getView?: unknown }).getView === 'function'
                ) {
                    const view = (candidate as { getView: () => unknown }).getView();
                    if (
                        view &&
                        (typeof view === 'object' || typeof view === 'function') &&
                        'getZoom' in view &&
                        typeof (view as { getZoom?: unknown }).getZoom === 'function'
                    ) {
                        const zoom = (view as { getZoom: () => unknown }).getZoom();
                        if (typeof zoom === 'number' && Number.isFinite(zoom)) {
                            return zoom;
                        }
                    }
                }
            } catch {
                // Ignore inaccessible candidates.
            }

            try {
                if (
                    candidate &&
                    (typeof candidate === 'object' || typeof candidate === 'function') &&
                    'getZoom' in candidate &&
                    typeof (candidate as { getZoom?: unknown }).getZoom === 'function'
                ) {
                    const zoom = (candidate as { getZoom: () => unknown }).getZoom();
                    if (typeof zoom === 'number' && Number.isFinite(zoom)) {
                        return zoom;
                    }
                }
            } catch {
                // Ignore inaccessible candidates.
            }

            return undefined;
        };

        const globalWindow = window as unknown as Record<string, unknown>;
        for (const name of ['map', 'olMap', 'openlayersMap', 'openLayersMap', '__map', 'appMap', 'mapInstance']) {
            try {
                enqueue(globalWindow[name], 0);
            } catch {
                // Ignore inaccessible globals.
            }
        }

        for (const name of Object.getOwnPropertyNames(window)) {
            try {
                enqueue(globalWindow[name], 0);
            } catch {
                // Ignore inaccessible globals.
            }
        }

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                continue;
            }

            const zoom = tryReadZoom(current.value);
            if (zoom !== undefined) {
                return zoom;
            }

            if (current.depth >= 2) {
                continue;
            }

            if (
                current.value instanceof Window ||
                current.value instanceof Document ||
                current.value instanceof Element ||
                current.value instanceof Node
            ) {
                continue;
            }

            let propertyNames: string[] = [];
            try {
                propertyNames = Object.getOwnPropertyNames(current.value as object).slice(0, 50);
            } catch {
                continue;
            }

            for (const propertyName of propertyNames) {
                if (['window', 'self', 'document', 'ownerDocument'].includes(propertyName)) {
                    continue;
                }

                try {
                    enqueue((current.value as Record<string, unknown>)[propertyName], current.depth + 1);
                } catch {
                    // Ignore inaccessible properties.
                }
            }
        }

        return undefined;
    });
}

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
    const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(zoomInButton).toBeEnabled();
    await expect(zoomOutButton).toBeEnabled();

    const directInitialZoom = await findZoomLevel(page);

    if (directInitialZoom !== undefined) {
        let zoomAfterZoomIn: number | undefined;

        await zoomInButton.click();

        await expect
            .poll(async () => {
                zoomAfterZoomIn = await findZoomLevel(page);
                return zoomAfterZoomIn;
            })
            .toBeGreaterThan(directInitialZoom);

        let zoomAfterZoomOut: number | undefined;

        await zoomOutButton.click();

        await expect
            .poll(async () => {
                zoomAfterZoomOut = await findZoomLevel(page);
                return zoomAfterZoomOut;
            })
            .toBeLessThan(zoomAfterZoomIn!);

        return;
    }

    let initialSignal: ZoomSignal | undefined;

    await expect
        .poll(async () => {
            const urls = await getPerformanceResourceUrls(page);
            initialSignal = pickRepresentativeSignal(
                urls
                    .map((url) => parseZoomSignalFromUrl(url))
                    .filter((signal): signal is ZoomSignal => signal !== undefined)
            );
            return initialSignal !== undefined;
        })
        .toBe(true);

    const capturedSignals: CapturedSignal[] = [];
    page.on('request', (request) => {
        const signal = parseZoomSignalFromUrl(request.url());
        if (signal) {
            capturedSignals.push({
                timestamp: Date.now(),
                signal
            });
        }
    });

    const resourceCountBeforeZoomIn = (await getPerformanceResourceUrls(page)).length;
    const zoomInActionTime = Date.now();

    await zoomInButton.click();

    let signalAfterZoomIn: ZoomSignal | undefined;

    await expect
        .poll(async () => {
            const newPerformanceUrls = (await getPerformanceResourceUrls(page)).slice(resourceCountBeforeZoomIn);
            const performanceSignals = newPerformanceUrls
                .map((url) => parseZoomSignalFromUrl(url))
                .filter((signal): signal is ZoomSignal => signal !== undefined);

            const requestSignals = capturedSignals
                .filter((entry) => entry.timestamp >= zoomInActionTime)
                .map((entry) => entry.signal);

            signalAfterZoomIn = pickRepresentativeSignal(
                [...performanceSignals, ...requestSignals],
                initialSignal!.strategy
            );

            return signalAfterZoomIn?.score;
        })
        .toBeGreaterThan(initialSignal!.score);

    const resourceCountBeforeZoomOut = (await getPerformanceResourceUrls(page)).length;
    const zoomOutActionTime = Date.now();

    await zoomOutButton.click();

    await expect
        .poll(async () => {
            const newPerformanceUrls = (await getPerformanceResourceUrls(page)).slice(resourceCountBeforeZoomOut);
            const performanceSignals = newPerformanceUrls
                .map((url) => parseZoomSignalFromUrl(url))
                .filter((signal): signal is ZoomSignal => signal !== undefined);

            const requestSignals = capturedSignals
                .filter((entry) => entry.timestamp >= zoomOutActionTime)
                .map((entry) => entry.signal);

            const signalAfterZoomOut = pickRepresentativeSignal(
                [...performanceSignals, ...requestSignals],
                initialSignal!.strategy
            );

            return signalAfterZoomOut?.score;
        })
        .toBeLessThan(signalAfterZoomIn!.score);
});
