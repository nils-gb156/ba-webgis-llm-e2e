// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const extractCoordinatesFromGeocoderPayload = (
        payload: unknown
    ): { lat: number; lon: number } | undefined => {
        const toNumber = (value: unknown) => {
            const number = Number(value);
            return Number.isFinite(number) ? number : undefined;
        };

        const fromObject = (value: unknown): { lat: number; lon: number } | undefined => {
            if (!value || typeof value !== 'object') {
                return undefined;
            }

            const objectValue = value as Record<string, unknown>;

            const lat =
                toNumber(objectValue.lat) ??
                toNumber(objectValue.latitude) ??
                toNumber(objectValue.y);
            const lon =
                toNumber(objectValue.lon) ??
                toNumber(objectValue.lng) ??
                toNumber(objectValue.longitude) ??
                toNumber(objectValue.x);

            if (lat !== undefined && lon !== undefined) {
                return { lat, lon };
            }

            const geometry = objectValue.geometry as Record<string, unknown> | undefined;
            const coordinates = geometry?.coordinates;
            if (Array.isArray(coordinates) && coordinates.length >= 2) {
                const geometryLon = toNumber(coordinates[0]);
                const geometryLat = toNumber(coordinates[1]);
                if (geometryLat !== undefined && geometryLon !== undefined) {
                    return { lat: geometryLat, lon: geometryLon };
                }
            }

            const center = objectValue.center;
            if (Array.isArray(center) && center.length >= 2) {
                const centerLon = toNumber(center[0]);
                const centerLat = toNumber(center[1]);
                if (centerLat !== undefined && centerLon !== undefined) {
                    return { lat: centerLat, lon: centerLon };
                }
            }

            const properties = objectValue.properties;
            if (properties && typeof properties === 'object') {
                return fromObject(properties);
            }

            return undefined;
        };

        if (Array.isArray(payload) && payload.length > 0) {
            return fromObject(payload[0]);
        }

        if (payload && typeof payload === 'object') {
            const objectPayload = payload as Record<string, unknown>;

            if (Array.isArray(objectPayload.features) && objectPayload.features.length > 0) {
                return fromObject(objectPayload.features[0]);
            }

            if (Array.isArray(objectPayload.results) && objectPayload.results.length > 0) {
                return fromObject(objectPayload.results[0]);
            }

            return fromObject(objectPayload);
        }

        return undefined;
    };

    const extractCoordinatesFromUrl = (url: string): { lat: number; lon: number } | undefined => {
        const toNumber = (value: string | null) => {
            if (value === null) {
                return undefined;
            }
            const number = Number(value);
            return Number.isFinite(number) ? number : undefined;
        };

        const parsedUrl = new URL(url);
        const lat =
            toNumber(parsedUrl.searchParams.get('lat')) ??
            toNumber(parsedUrl.searchParams.get('latitude')) ??
            toNumber(parsedUrl.searchParams.get('y'));
        const lon =
            toNumber(parsedUrl.searchParams.get('lon')) ??
            toNumber(parsedUrl.searchParams.get('lng')) ??
            toNumber(parsedUrl.searchParams.get('longitude')) ??
            toNumber(parsedUrl.searchParams.get('x'));

        if (lat === undefined || lon === undefined) {
            return undefined;
        }

        return { lat, lon };
    };

    const extractForecastEntryCount = (payload: unknown): number | undefined => {
        if (Array.isArray(payload)) {
            return payload.length;
        }

        if (!payload || typeof payload !== 'object') {
            return undefined;
        }

        const objectPayload = payload as Record<string, unknown>;

        const directArrays = ['entries', 'forecast', 'items', 'hours', 'data'];
        for (const key of directArrays) {
            const value = objectPayload[key];
            if (Array.isArray(value)) {
                return value.length;
            }
        }

        const hourly = objectPayload.hourly;
        if (hourly && typeof hourly === 'object') {
            const hourlyObject = hourly as Record<string, unknown>;
            if (Array.isArray(hourlyObject.time)) {
                return hourlyObject.time.length;
            }

            for (const value of Object.values(hourlyObject)) {
                if (Array.isArray(value)) {
                    return value.length;
                }
            }
        }

        const properties = objectPayload.properties;
        if (properties && typeof properties === 'object') {
            const propertiesObject = properties as Record<string, unknown>;
            if (Array.isArray(propertiesObject.timeseries)) {
                return propertiesObject.timeseries.length;
            }
        }

        return undefined;
    };

    const getLayerToggle = async (layerName: string) => {
        const nameMatcher = new RegExp(escapeRegex(layerName), 'i');
        const checkbox = page.getByRole('checkbox', { name: nameMatcher });
        const switchControl = page.getByRole('switch', { name: nameMatcher });
        const button = page.getByRole('button', { name: nameMatcher });

        await expect.poll(async () => {
            return (await checkbox.count()) + (await switchControl.count()) + (await button.count());
        }).toBeGreaterThan(0);

        if (await checkbox.count()) {
            return { locator: checkbox.first(), kind: 'checkbox' as const };
        }

        if (await switchControl.count()) {
            return { locator: switchControl.first(), kind: 'switch' as const };
        }

        return { locator: button.first(), kind: 'button' as const };
    };

    const getLayerVisibilityState = async (layerName: string) => {
        const { locator, kind } = await getLayerToggle(layerName);

        if (kind === 'button') {
            return (await locator.getAttribute('aria-pressed')) === 'true';
        }

        return await locator.isChecked();
    };

    const setLayerVisibilityState = async (layerName: string, visible: boolean) => {
        const { locator, kind } = await getLayerToggle(layerName);

        if (kind === 'button') {
            const pressed = (await locator.getAttribute('aria-pressed')) === 'true';
            if (pressed !== visible) {
                await locator.click();
            }
            await expect(locator).toHaveAttribute('aria-pressed', String(visible));
            return;
        }

        const checked = await locator.isChecked();
        if (checked !== visible) {
            await locator.click({ force: true });
        }

        if (visible) {
            await expect(locator).toBeChecked();
        } else {
            await expect(locator).not.toBeChecked();
        }
    };

    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText(/Temperature/i)).toBeVisible();
    await expect(page.getByText(/Precipitation/i)).toBeVisible();

    const searchField = page.getByRole('textbox', { name: /search/i }).first();
    await expect(searchField).toBeVisible();

    const measureButton = page.getByRole('button', { name: /^measure/i }).first();
    if (await measureButton.count()) {
        await expect(measureButton).toHaveAttribute('aria-pressed', 'false');
    }

    await expect.poll(() => getLayerVisibilityState('Temperature')).toBe(true);
    await expect.poll(() => getLayerVisibilityState('Precipitation')).toBe(false);

    await setLayerVisibilityState('Temperature', false);
    await setLayerVisibilityState('Precipitation', true);

    await expect.poll(() => getLayerVisibilityState('Temperature')).toBe(false);
    await expect.poll(() => getLayerVisibilityState('Precipitation')).toBe(true);

    const geocoderResponsePromise = page.waitForResponse((response) => {
        if (!response.ok()) {
            return false;
        }

        const url = response.url();
        let decodedUrl = url;
        try {
            decodedUrl = decodeURIComponent(url);
        } catch {
            decodedUrl = url;
        }

        return (
            /münster/i.test(decodedUrl) &&
            !/forecast|weather|wms|wmts|tile/i.test(decodedUrl)
        );
    });

    await searchField.click();
    await searchField.fill('Münster');

    const geocoderResponse = await geocoderResponsePromise;
    const geocoderPayload = await geocoderResponse.json().catch(() => undefined);
    const selectedCoordinates = extractCoordinatesFromGeocoderPayload(geocoderPayload);

    expect(selectedCoordinates).toBeDefined();

    await expect.poll(async () => {
        const optionCount = await page.getByRole('option').count();
        if (optionCount > 0) {
            return optionCount;
        }

        const resultButtonCount = await page.getByRole('button', { name: /Münster/i }).count();
        if (resultButtonCount > 0) {
            return resultButtonCount;
        }

        return await page.getByText(/Münster/i).count();
    }).toBeGreaterThan(0);

    let firstResult = page.getByRole('option').first();
    if ((await page.getByRole('option').count()) === 0) {
        const resultButtons = page.getByRole('button', { name: /Münster/i });
        if (await resultButtons.count()) {
            firstResult = resultButtons.first();
        } else {
            firstResult = page.getByText(/Münster/i).first();
        }
    }

    await expect(firstResult).toBeVisible();

    const forecastRequestUrls: string[] = [];
    page.on('request', (request) => {
        if (/forecast|weather/i.test(request.url())) {
            forecastRequestUrls.push(request.url());
        }
    });

    const previousForecastRequestCount = forecastRequestUrls.length;
    const forecastResponsePromise = page.waitForResponse((response) => {
        return response.ok() && /forecast|weather/i.test(response.url());
    });

    await firstResult.click();

    const forecastResponse = await forecastResponsePromise;
    const forecastPayload = await forecastResponse.json().catch(() => undefined);

    await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(previousForecastRequestCount);

    const latestForecastRequestUrl = forecastRequestUrls.at(-1);
    expect(latestForecastRequestUrl).toBeDefined();

    const forecastCoordinates = latestForecastRequestUrl
        ? extractCoordinatesFromUrl(latestForecastRequestUrl)
        : undefined;

    expect(forecastCoordinates).toBeDefined();
    expect(Math.abs((forecastCoordinates?.lat ?? 0) - (selectedCoordinates?.lat ?? 0))).toBeLessThan(0.5);
    expect(Math.abs((forecastCoordinates?.lon ?? 0) - (selectedCoordinates?.lon ?? 0))).toBeLessThan(0.5);

    await expect(searchField).toHaveValue(/Münster/i);

    const forecastHeading = page.getByRole('heading', { name: /weather forecast|forecast/i }).first();
    await expect(forecastHeading).toBeVisible();

    const forecastEntryCount = extractForecastEntryCount(forecastPayload);
    expect(forecastEntryCount).toBe(24);
});
