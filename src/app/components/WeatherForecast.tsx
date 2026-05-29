// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { Box, Separator, Text } from "@chakra-ui/react";

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

export function WeatherForecast({ coordinate }: WeatherForecastProps) {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    const [forecast, setForecast] = useState<ForecastEntry[]>([]);
    const [locationLabel, setLocationLabel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!coordinate || !apiKey) {
            setForecast([]);
            setLocationLabel(null);
            setError(null);
            return;
        }
        const [lat, lon] = coordinate;
        fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=24`
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
            .catch(() => {
                setForecast([]);
                setLocationLabel(null);
                setError("Fehler beim Laden der Wetterdaten");
            });
    }, [coordinate, apiKey]);

    if (error) {
        return <p>{error}</p>;
    }

    if (!forecast.length) {
        return <p>Loading...</p>;
    }

    return (
        <>
            {locationLabel && (
                <Text fontSize="sm" color="gray.600" mb={2}>
                    <Text as="span" fontWeight="semibold">
                        Location:
                    </Text>{" "}
                    {locationLabel}
                </Text>
            )}
            <Box
                maxHeight="500px"
                overflowY="auto"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                p={2}
            >
                {forecast.map((entry: ForecastEntry, idx: number) => (
                    <Box key={entry.dt}>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">
                                Datetime:
                            </Text>{" "}
                            {entry.dt_txt}
                        </Text>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">
                                Weather:
                            </Text>{" "}
                            {entry.weather?.[0]?.description}
                        </Text>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">
                                Temperature:
                            </Text>{" "}
                            {entry.main?.temp} °C
                        </Text>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">
                                Humidity:
                            </Text>{" "}
                            {entry.main?.humidity} %
                        </Text>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">
                                Wind direction:
                            </Text>{" "}
                            {entry.wind?.deg}°
                        </Text>
                        <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">
                                Wind speed:
                            </Text>{" "}
                            {entry.wind?.speed} m/s
                        </Text>
                        {idx < forecast.length - 1 && <Separator my={3} />}
                    </Box>
                ))}
            </Box>
        </>
    );
}
