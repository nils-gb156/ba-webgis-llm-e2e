// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { Box, Separator, SimpleGrid, Stack, Text } from "@chakra-ui/react";

export interface WeatherForecastProps {
    coordinate?: [number, number];
}

interface ForecastEntry {
    dt: number;
    dt_txt: string;
    main: {
        temp: number;
        humidity: number;
    };
    weather: { description: string }[];
    wind: {
        deg: number;
        speed: number;
    };
}

interface ForecastCity {
    name?: string;
    country?: string;
}

// Shared formatter instance (created once, not per render) for the forecast
// timestamps. Uses the browser's locale and time zone.
const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
});

// Formats a Unix timestamp (seconds) into a readable local date/time string,
// falling back to the raw API string if the value is invalid.
function formatForecastDate(unixSeconds: number, fallback: string): string {
    if (!Number.isFinite(unixSeconds)) {
        return fallback;
    }
    return DATE_TIME_FORMAT.format(new Date(unixSeconds * 1000));
}

// Shows a 24-step OpenWeather forecast for the coordinate the user clicked on.
export function WeatherForecast({ coordinate }: WeatherForecastProps) {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    const [forecast, setForecast] = useState<ForecastEntry[]>([]);
    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const lat = coordinate?.[0];
    const lon = coordinate?.[1];

    useEffect(() => {
        if (lat == null || lon == null || !apiKey) {
            setForecast([]);
            setLocationLabel(null);
            setError(null);
            return;
        }

        // Fetch the 24-step forecast for the clicked coordinate; abort the request
        // if the coordinate changes or the component unmounts.
        const controller = new AbortController();
        fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=24`,
            { signal: controller.signal }
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.cod !== "200" || !data.list) {
                    setForecast([]);
                    setLocationLabel(null);
                    setError("Fehler beim Laden der Wetterdaten");
                } else {
                    setForecast(data.list);
                    const city = data.city as ForecastCity | undefined;
                    const label = city?.name
                        ? city.country
                            ? `${city.name}, ${city.country}`
                            : city.name
                        : null;
                    setLocationLabel(label);
                    setError(null);
                }
            })
            .catch((err: unknown) => {
                if (err instanceof Error && err.name === "AbortError") return;
                setForecast([]);
                setLocationLabel(null);
                setError("Fehler beim Laden der Wetterdaten");
            });

        return () => {
            controller.abort();
        };
    }, [lat, lon, apiKey]);

    if (error) {
        return (
            <Text fontSize="sm" color="red.600">
                {error}
            </Text>
        );
    }

    if (!forecast.length) {
        return (
            <Text fontSize="sm" color="gray.600">
                Loading...
            </Text>
        );
    }

    return (
        <>
            {locationLabel && (
                <Text fontSize="sm" mb={2}>
                    <Text as="span" fontWeight="semibold">
                        Location:
                    </Text>{" "}
                    {locationLabel}
                </Text>
            )}
            <Box
                data-testid="weather-forecast"
                maxHeight="200px"
                overflowY="auto"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={3}
                bg="gray.50"
            >
                <Stack gap={4}>
                    {forecast.map((entry: ForecastEntry, idx: number) => (
                        <Box key={entry.dt} data-testid="weather-forecast-entry">
                            <Text fontSize="sm" fontWeight="semibold">
                                {formatForecastDate(entry.dt, entry.dt_txt)}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                                {entry.weather?.[0]?.description}
                            </Text>
                            <SimpleGrid columns={2} columnGap={4} rowGap={1} mt={2}>
                                <Text fontSize="sm" color="gray.600">
                                    Temperature
                                </Text>
                                <Text fontSize="sm">{entry.main?.temp} °C</Text>
                                <Text fontSize="sm" color="gray.600">
                                    Humidity
                                </Text>
                                <Text fontSize="sm">{entry.main?.humidity} %</Text>
                                <Text fontSize="sm" color="gray.600">
                                    Wind direction
                                </Text>
                                <Text fontSize="sm">{entry.wind?.deg}°</Text>
                                <Text fontSize="sm" color="gray.600">
                                    Wind speed
                                </Text>
                                <Text fontSize="sm">{entry.wind?.speed} m/s</Text>
                            </SimpleGrid>
                            {idx < forecast.length - 1 && <Separator mt={3} />}
                        </Box>
                    ))}
                </Stack>
            </Box>
        </>
    );
}
