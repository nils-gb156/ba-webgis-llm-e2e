// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

function isForecastRequestUrl(url: string): boolean {
    return /(?:open-meteo|met\.no|weatherapi|weather-forecast|\/forecast(?:[/?]|$)|\/weather(?:[-/?]|$))/i.test(
        url
    );
}

function buildForecastResponse(requestUrl: string): string {
    const url = new URL(requestUrl);
    const latitude = Number(url.searchParams.get('latitude') ?? url.searchParams.get('lat') ?? '51.5168');
    const longitude = Number(url.searchParams.get('longitude') ?? url.searchParams.get('lon') ?? '10.4478');

    const start = new Date(Date.UTC(2025, 0, 15, 0, 0, 0));
    const times: string[] = [];
    const temperatures: number[] = [];
    const precipitationProbability: number[] = [];
    const precipitation: number[] = [];
    const weatherCodes: number[] = [];
    const relativeHumidity: number[] = [];
    const windSpeed10m: number[] = [];
    const cloudCover: number[] = [];
    const isDay: number[] = [];
    const timeseries: Array<{
        time: string;
        data: {
            instant: {
                details: {
                    air_temperature: number;
                    relative_humidity: number;
                    wind_speed: number;
                    wind_from_direction: number;
                    cloud_area_fraction: number;
                    air_pressure_at_sea_level: number;
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
            next_6_hours: {
                summary: {
                    symbol_code: string;
                };
                details: {
                    precipitation_amount: number;
                };
            };
            next_12_hours: {
                summary: {
                    symbol_code: string;
                };
            };
        };
    }> = [];
    const entries: Array<{
        time: string;
        temperature: number;
        precipitationProbability: number;
        precipitation: number;
        weatherCode: number;
    }> = [];

    const symbolCodes = [
        'clearsky_day',
        'fair_day',
        'partlycloudy_day',
        'cloudy',
        'lightrain',
        'rain',
        'lightsleet',
        'snow'
    ];

    for (let index = 0; index < 24; index += 1) {
        const time = new Date(start.getTime() + index * 60 * 60 * 1000).toISOString();
        const temperature = Math.round((2 + index * 0.5) * 10) / 10;
        const precipitationAmount = index % 6 === 0 ? 0.8 : index % 4 === 0 ? 0.2 : 0;
        const precipitationChance = precipitationAmount > 0 ? 60 : 15;
        const weatherCode =
            precipitationAmount > 0 ? (precipitationAmount >= 0.5 ? 61 : 51) : index % 5 === 0 ? 3 : 1;
        const symbolCode =
            precipitationAmount > 0
                ? precipitationAmount >= 0.5
                    ? 'rain'
                    : 'lightrain'
                : symbolCodes[index % symbolCodes.length];
        const humidity = 55 + (index % 20);
        const wind = 8 + (index % 6);
        const clouds = 20 + ((index * 7) % 70);
        const day = index >= 6 && index <= 18 ? 1 : 0;

        times.push(time);
        temperatures.push(temperature);
        precipitationProbability.push(precipitationChance);
        precipitation.push(precipitationAmount);
        weatherCodes.push(weatherCode);
        relativeHumidity.push(humidity);
        windSpeed10m.push(wind);
        cloudCover.push(clouds);
        isDay.push(day);

        timeseries.push({
            time,
            data: {
                instant: {
                    details: {
                        air_temperature: temperature,
                        relative_humidity: humidity,
                        wind_speed: Math.round((wind / 3.6) * 10) / 10,
                        wind_from_direction: 180,
                        cloud_area_fraction: clouds,
                        air_pressure_at_sea_level: 1013
                    }
                },
                next_1_hours: {
                    summary: {
                        symbol_code: symbolCode
                    },
                    details: {
                        precipitation_amount: precipitationAmount
                    }
                },
                next_6_hours: {
                    summary: {
                        symbol_code: symbolCode
                    },
                    details: {
                        precipitation_amount: precipitationAmount
                    }
                },
                next_12_hours: {
                    summary: {
                        symbol_code: symbolCode
                    }
                }
            }
        });

        entries.push({
            time,
            temperature,
            precipitationProbability: precipitationChance,
            precipitation: precipitationAmount,
            weatherCode
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
        geometry: {
            type: 'Point',
            coordinates: [longitude, latitude, 250]
        },
        hourly_units: {
            time: 'iso8601',
            temperature_2m: '°C',
            precipitation_probability: '%',
            precipitation: 'mm',
            weather_code: 'wmo code',
            relative_humidity_2m: '%',
            wind_speed_10m: 'km/h',
            cloud_cover: '%',
            is_day: ''
        },
        hourly: {
            time: times,
            temperature_2m: temperatures,
            precipitation_probability: precipitationProbability,
            precipitation,
            weather_code: weatherCodes,
            relative_humidity_2m: relativeHumidity,
            wind_speed_10m: windSpeed10m,
            cloud_cover: cloudCover,
            is_day: isDay
        },
        properties: {
            meta: {
                updated_at: times[0],
                units: {
                    air_temperature: 'celsius',
                    relative_humidity: '%',
                    wind_speed: 'm/s',
                    wind_from_direction: 'degrees',
                    precipitation_amount: 'mm',
                    cloud_area_fraction: '%',
                    air_pressure_at_sea_level: 'hPa'
                }
            },
            timeseries
        },
        timeseries,
        forecast: entries,
        entries,
        data: entries
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
                entryCount: undefined
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

        for (const list of section.querySelectorAll('ul, ol, [role="list"]')) {
            const itemCount = list.querySelectorAll(':scope > li, :scope > [role="listitem"]').length;
            if (itemCount > 0) {
                counts.push(itemCount);
            }
        }

        const allListItemCount = section.querySelectorAll('li, [role="listitem"]').length;
        if (allListItemCount > 0) {
            counts.push(allListItemCount);
        }

        const timeLabels = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
        if (timeLabels.length > 0) {
            counts.push(new Set(timeLabels).size);
        }

        const isoHours = text.match(/\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z/g) ?? [];
        if (isoHours.length > 0) {
            counts.push(new Set(isoHours).size);
        }

        const exactMatch = counts.find((count) => count === 24);
        const entryCount = exactMatch ?? counts.sort((a, b) => b - a)[0];

        return {
            text,
            hasPlaceholder,
            hasError,
            entryCount
        };
    });
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
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

    let capturedForecastRequestUrl: string | undefined;
    page.on('request', (request) => {
        if (['fetch', 'xhr'].includes(request.resourceType()) && isForecastRequestUrl(request.url())) {
            capturedForecastRequestUrl = request.url();
        }
    });

    await page.route(
        /(?:open-meteo|met\.no|weatherapi|weather-forecast|\/forecast(?:[/?]|$)|\/weather(?:[-/?]|$))/i,
        async (route) => {
            const request = route.request();
            const corsHeaders = {
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET, OPTIONS',
                'access-control-allow-headers': '*'
            };

            if (request.method() === 'OPTIONS') {
                await route.fulfill({
                    status: 204,
                    headers: corsHeaders
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                headers: corsHeaders,
                body: buildForecastResponse(request.url())
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
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect.poll(() => capturedForecastRequestUrl).toMatch(/.+/);

    await expect
        .poll(async () => JSON.stringify(await getHighlightedCoordinate(page)), { timeout: 10000 })
        .not.toBe(previousHighlight);
    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();

    await expect
        .poll(async () => getForecastSectionState(page), { timeout: 15000 })
        .toEqual(
            expect.objectContaining({
                hasPlaceholder: false,
                hasError: false,
                entryCount: 24
            })
        );
});
