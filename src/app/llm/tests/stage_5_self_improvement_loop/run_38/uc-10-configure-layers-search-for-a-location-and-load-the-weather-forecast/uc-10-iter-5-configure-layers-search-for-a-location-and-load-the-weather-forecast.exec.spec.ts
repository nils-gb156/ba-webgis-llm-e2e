// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const initialCenter = await getMapCenter(page);
    if (!initialCenter) {
        throw new Error('Map center was not available after application startup.');
    }

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('precipitation-legend')).toHaveCount(0);

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect(page.getByTestId('temperature-legend')).toHaveCount(0);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const optionResult = geocoderPanel.getByRole('option').first();
    const buttonResult = geocoderPanel.getByRole('button').filter({ hasText: /Münster/i }).first();
    const listItemResult = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i }).first();
    const textResult = geocoderPanel.getByText(/Münster/i).first();

    const resolveResultKind = async (): Promise<'option' | 'button' | 'listitem' | 'text' | ''> => {
        if ((await optionResult.count()) > 0 && (await optionResult.isVisible().catch(() => false))) {
            return 'option';
        }
        if ((await buttonResult.count()) > 0 && (await buttonResult.isVisible().catch(() => false))) {
            return 'button';
        }
        if ((await listItemResult.count()) > 0 && (await listItemResult.isVisible().catch(() => false))) {
            return 'listitem';
        }
        if ((await textResult.count()) > 0 && (await textResult.isVisible().catch(() => false))) {
            return 'text';
        }
        return '';
    };

    await expect.poll(resolveResultKind, { timeout: 15000 }).not.toBe('');

    const resultKind = await resolveResultKind();
    if (resultKind === 'option') {
        await optionResult.click();
    } else if (resultKind === 'button') {
        await buttonResult.click();
    } else if (resultKind === 'listitem') {
        await listItemResult.click();
    } else if (resultKind === 'text') {
        await textResult.click();
    } else {
        throw new Error('No selectable geocoder result appeared for "Münster".');
    }

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect
        .poll(
            async () => {
                const center = await getMapCenter(page);
                if (!center) {
                    return 0;
                }
                const dx = center[0] - initialCenter[0];
                const dy = center[1] - initialCenter[1];
                return Math.hypot(dx, dy);
            },
            { timeout: 15000 }
        )
        .toBeGreaterThan(50000);

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 15000 }).not.toBeUndefined();

    await expect
        .poll(
            async () => {
                const coordinate = await getHighlightedCoordinate(page);
                if (!coordinate) {
                    return Number.POSITIVE_INFINITY;
                }
                const muensterApproximate3857: [number, number] = [849000, 6790000];
                const dx = coordinate[0] - muensterApproximate3857[0];
                const dy = coordinate[1] - muensterApproximate3857[1];
                return Math.hypot(dx, dy);
            },
            { timeout: 15000 }
        )
        .toBeLessThan(100000);

    await expect
        .poll(
            async () => {
                const center = await getMapCenter(page);
                const coordinate = await getHighlightedCoordinate(page);
                if (!center || !coordinate) {
                    return Number.POSITIVE_INFINITY;
                }
                const dx = center[0] - coordinate[0];
                const dy = center[1] - coordinate[1];
                return Math.hypot(dx, dy);
            },
            { timeout: 15000 }
        )
        .toBeLessThan(20000);

    const getHighlightPixel = async (): Promise<[number, number] | undefined> => {
        const coordinate = await getHighlightedCoordinate(page);
        if (!coordinate) {
            return undefined;
        }
        return await page.evaluate((coords) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coordinate: number[]) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coords);
            return Array.isArray(pixel) && pixel.length >= 2 ? [pixel[0], pixel[1]] : undefined;
        }, coordinate);
    };

    await expect.poll(getHighlightPixel, { timeout: 15000 }).not.toBeUndefined();

    const highlightPixel = await getHighlightPixel();
    if (!highlightPixel) {
        throw new Error('Could not determine the highlighted search result position on the map.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Could not determine the map container size.');
    }

    expect(highlightPixel[0]).toBeGreaterThanOrEqual(0);
    expect(highlightPixel[1]).toBeGreaterThanOrEqual(0);
    expect(highlightPixel[0]).toBeLessThanOrEqual(mapBox.width);
    expect(highlightPixel[1]).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({
        position: {
            x: Math.round(highlightPixel[0]),
            y: Math.round(highlightPixel[1]),
        },
    });

    const readForecastState = async (): Promise<{ hasError: boolean; hasPrompt: boolean; count: number }> => {
        return await weatherForecastSection.evaluate((section) => {
            const text = section.textContent ?? '';
            const hasError = /Fehler beim Laden der Wetterdaten/i.test(text);
            const hasPrompt = /Click on the map to load a forecast\./i.test(text);

            const tableRows = section.querySelectorAll('tbody tr').length;
            if (tableRows > 0) {
                return { hasError, hasPrompt, count: tableRows };
            }

            const roleRows = section.querySelectorAll('[role="row"]').length;
            if (roleRows > 0) {
                const columnHeaders = section.querySelectorAll('[role="columnheader"]').length;
                return { hasError, hasPrompt, count: Math.max(0, roleRows - (columnHeaders > 0 ? 1 : 0)) };
            }

            const listItems = section.querySelectorAll('li, [role="listitem"]').length;
            if (listItems > 0) {
                return { hasError, hasPrompt, count: listItems };
            }

            const articles = section.querySelectorAll('article').length;
            if (articles > 0) {
                return { hasError, hasPrompt, count: articles };
            }

            const parents = [section, ...Array.from(section.querySelectorAll('div, section, ul, ol'))];
            for (const parent of parents) {
                const children = Array.from(parent.children).filter(
                    (child) => (child.textContent ?? '').trim().length > 0
                );
                if (children.length === 24) {
                    return { hasError, hasPrompt, count: 24 };
                }

                const signatureCount = new Map<string, number>();
                for (const child of children) {
                    const element = child as HTMLElement;
                    const className =
                        typeof element.className === 'string'
                            ? element.className
                            : Array.from(element.classList).join(' ');
                    const signature = `${child.tagName}|${child.getAttribute('role') ?? ''}|${className}`;
                    signatureCount.set(signature, (signatureCount.get(signature) ?? 0) + 1);
                }

                if ([...signatureCount.values()].some((count) => count === 24)) {
                    return { hasError, hasPrompt, count: 24 };
                }
            }

            const hhmmMatches = Array.from(text.matchAll(/\b([01]?\d|2[0-3]):00\b/g)).map((match) =>
                match[1].padStart(2, '0')
            );
            if (new Set(hhmmMatches).size === 24) {
                return { hasError, hasPrompt, count: 24 };
            }

            const hourWordMatches = Array.from(text.matchAll(/\b([01]?\d|2[0-3])\s*(?:Uhr|h)\b/g)).map((match) =>
                match[1].padStart(2, '0')
            );
            if (new Set(hourWordMatches).size === 24) {
                return { hasError, hasPrompt, count: 24 };
            }

            const isoHourMatches = Array.from(text.matchAll(/\b\d{4}-\d{2}-\d{2}[T ]([01]\d|2[0-3]):00\b/g)).map(
                (match) => match[1]
            );
            if (new Set(isoHourMatches).size === 24) {
                return { hasError, hasPrompt, count: 24 };
            }

            return { hasError, hasPrompt, count: 0 };
        });
    };

    await expect
        .poll(readForecastState, { timeout: 30000 })
        .toEqual({ hasError: false, hasPrompt: false, count: 24 });

    await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toHaveCount(0);
    await expect(weatherForecastSection.getByText(/Fehler beim Laden der Wetterdaten/i)).toHaveCount(0);
});
