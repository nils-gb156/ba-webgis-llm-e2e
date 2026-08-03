// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

function isForecastRequestUrl(url: string): boolean {
    return /(?:open-meteo|met\.no|weatherapi|weather-forecast|\/forecast(?:[/?]|$)|\/weather(?:[-/?]|$))/i.test(
        url
    );
}

function buildMockForecastResponse(requestUrl: string): string {
    const url = new URL(requestUrl);
    const latitude = Number(url.searchParams.get('latitude') ?? url.searchParams.get('lat') ?? '50.95');
    const longitude = Number(url.searchParams.get('longitude') ?? url.searchParams.get('lon') ?? '10.45');

    const times: string[] = [];
    const temperatures: number[] = [];
    const precipitationProbability: number[] = [];
    const precipitation: number[] = [];
    const weatherCodes: number[] = [];
    const symbolCodes = [
        'clearsky_day',
        'fair_day',
        'partlycloudy_day',
        'cloudy',
        'lightrain',
        'rain',
        'lightsleet',
        'snow',
    ];
    const timeseries: Array<{
        time: string;
        data: {
            instant: {
                details: {
                    air_temperature: number;
                    relative_humidity: number;
                    wind_speed: number;
                    wind_from_direction: number;
                };
            };
            next_1_hours: {
                summary: {
                    symbol_code: string;
                };
                details: {
                    precipitation_amount: number;
                };
            };
        };
    }> = [];

    const start = new Date(Date.UTC(2025, 0, 15, 0, 0, 0));

    for (let index = 0; index < 24; index += 1) {
        const time = new Date(start.getTime() + index * 60 * 60 * 1000).toISOString();
        const temperature = Math.round((-2 + index * 0.7) * 10) / 10;
        const precipitationAmount = index % 6 === 0 ? 0.6 : index % 4 === 0 ? 0.2 : 0;
        const precipitationChance = precipitationAmount > 0 ? 55 : 15;
        const weatherCode =
            precipitationAmount > 0 ? (precipitationAmount >= 0.5 ? 61 : 51) : index % 5 === 0 ? 3 : 1;
        const symbolCode =
            precipitationAmount > 0
                ? precipitationAmount >= 0.5
                    ? 'rain'
                    : 'lightrain'
                : symbolCodes[index % symbolCodes.length];

        times.push(time);
        temperatures.push(temperature);
        precipitationProbability.push(precipitationChance);
        precipitation.push(precipitationAmount);
        weatherCodes.push(weatherCode);
        timeseries.push({
            time,
            data: {
                instant: {
                    details: {
                        air_temperature: temperature,
                        relative_humidity: 55 + (index % 20),
                        wind_speed: 3 + (index % 5),
                        wind_from_direction: 180,
                    },
                },
                next_1_hours: {
                    summary: {
                        symbol_code: symbolCode,
                    },
                    details: {
                        precipitation_amount: precipitationAmount,
                    },
                },
            },
        });
    }

    return JSON.stringify({
        latitude,
        longitude,
        generationtime_ms: 0.12,
        utc_offset_seconds: 0,
        timezone: 'UTC',
        timezone_abbreviation: 'UTC',
        elevation: 250,
        hourly_units: {
            time: 'iso8601',
            temperature_2m: '°C',
            precipitation_probability: '%',
            precipitation: 'mm',
            weather_code: 'wmo code',
        },
        hourly: {
            time: times,
            temperature_2m: temperatures,
            precipitation_probability: precipitationProbability,
            precipitation,
            weather_code: weatherCodes,
        },
        properties: {
            meta: {
                updated_at: times[0],
                units: {
                    air_temperature: 'celsius',
                    precipitation_amount: 'mm',
                },
            },
            timeseries,
        },
        timeseries,
        forecast: times.map((time, index) => ({
            time,
            temperature: temperatures[index],
            precipitationProbability: precipitationProbability[index],
            precipitation: precipitation[index],
            weatherCode: weatherCodes[index],
        })),
        entries: times.map((time, index) => ({
            time,
            temperature: temperatures[index],
            precipitationProbability: precipitationProbability[index],
            precipitation: precipitation[index],
            weatherCode: weatherCodes[index],
        })),
    });
}

async function getForecastSectionState(page: Parameters<typeof test>[0]['page']): Promise<{
    text: string;
    hasPlaceholder: boolean;
    hasError: boolean;
    entryCount?: number;
}> {
    return page.evaluate(() => {
        const section = document.querySelector('[data-testid="weather-forecast-section"]');
        if (!section) {
            return {
                text: '',
                hasPlaceholder: false,
                hasError: false,
                entryCount: undefined,
            };
        }

        const text = (section.textContent ?? '').replace(/\s+/g, ' ').trim();
        const hasPlaceholder = text.includes('Click on the map to load a forecast.');
        const hasError = text.includes('Fehler beim Laden der Wetterdaten');

        const counts: number[] = [];

        for (const tbody of section.querySelectorAll('tbody')) {
            const rowCount = tbody.querySelectorAll('tr').length;
            if (rowCount > 0) {
                counts.push(rowCount);
            }
        }

        for (const table of section.querySelectorAll('table')) {
            const rows = Array.from(table.querySelectorAll('tr'));
            if (rows.length > 0) {
                const headerRows = rows.filter((row) => row.querySelector('th,[role="columnheader"]')).length;
                const dataRows = rows.length - Math.min(headerRows, 1);
                if (dataRows > 0) {
                    counts.push(dataRows);
                }
            }
        }

        for (const grid of section.querySelectorAll('[role="table"], [role="grid"]')) {
            const rows = grid.querySelectorAll('[role="row"]').length;
            const headerRows = grid.querySelectorAll('[role="columnheader"]').length > 0 ? 1 : 0;
            const dataRows = rows - headerRows;
            if (dataRows > 0) {
                counts.push(dataRows);
            }
        }

        const listItemCount = section.querySelectorAll('li, [role="listitem"]').length;
        if (listItemCount > 0) {
            counts.push(listItemCount);
        }

        const accordionButtonCount = section.querySelectorAll('button[aria-expanded]').length;
        if (accordionButtonCount > 0) {
            counts.push(accordionButtonCount);
        }

        const nestedHeadingCount = section.querySelectorAll('h2, h3, h4, h5, h6, [role="heading"]').length;
        if (nestedHeadingCount > 1) {
            counts.push(nestedHeadingCount - 1);
        }

        const hourLabels = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
        if (hourLabels.length > 0) {
            counts.push(new Set(hourLabels).size);
        }

        const isoHourLabels = text.match(/\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z/g) ?? [];
        if (isoHourLabels.length > 0) {
            counts.push(new Set(isoHourLabels).size);
        }

        const entryCount = counts.find((count) => count === 24) ?? counts.sort((a, b) => b - a)[0];

        return {
            text,
            hasPlaceholder,
            hasError,
            entryCount,
        };
    });
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    const forecastRequests: string[] = [];
    page.on('request', (request) => {
        if (['fetch', 'xhr'].includes(request.resourceType()) && isForecastRequestUrl(request.url())) {
            forecastRequests.push(request.url());
        }
    });

    await page.route(
        /(?:open-meteo|met\.no|weatherapi|weather-forecast|\/forecast(?:[/?]|$)|\/weather(?:[-/?]|$))/i,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: buildMockForecastResponse(route.request().url()),
            });
        }
    );

    const previousHighlight = JSON.stringify(await getHighlightedCoordinate(page));
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.5),
            y: Math.round(mapBox.height * 0.45),
        },
    });

    await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);

    await expect
        .poll(async () => JSON.stringify(await getHighlightedCoordinate(page)), { timeout: 10000 })
        .not.toBe(previousHighlight);
    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();

    await expect
        .poll(
            async () => {
                const state = await getForecastSectionState(page);
                if (state.hasError) {
                    return `error:${state.text}`;
                }
                if (state.hasPlaceholder) {
                    return 'placeholder';
                }
                return `entries:${String(state.entryCount)}`;
            },
            { timeout: 15000 }
        )
        .toBe('entries:24');
});
