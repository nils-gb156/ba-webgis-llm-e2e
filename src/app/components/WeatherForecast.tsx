// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { Box, Separator } from "@chakra-ui/react";

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
        return <p data-testid="weather-forecast-error">{error}</p>;
    }

    if (!forecast.length) {
        return <p data-testid="weather-forecast-loading">Loading...</p>;
    }

    return (
        <>
            {locationLabel && (
                <div data-testid="weather-forecast-location">
                    <strong>location:</strong> {locationLabel}
                </div>
            )}
            <Box
                data-testid="weather-forecast-container"
                maxHeight="780px"
                overflowY="auto"
                border="1px solid #ccc"
                borderRadius="md"
                p={2}
            >
                {forecast.map((entry: ForecastEntry, idx: number) => (
                    <div key={entry.dt} data-testid={`forecast-entry-${idx}`}>
                        <div data-testid={`forecast-dt-${idx}`}>
                            <strong>Datetime:</strong> {entry.dt_txt}
                        </div>
                        <div data-testid={`forecast-weather-${idx}`}>
                            <strong>Weather:</strong> {entry.weather?.[0]?.description}
                        </div>
                        <div data-testid={`forecast-temp-${idx}`}>
                            <strong>Temperature:</strong> {entry.main?.temp} °C
                        </div>
                        <div data-testid={`forecast-humidity-${idx}`}>
                            <strong>Humidity:</strong> {entry.main?.humidity} %
                        </div>
                        <div data-testid={`forecast-wind-deg-${idx}`}>
                            <strong>Winddirection:</strong> {entry.wind?.deg}°
                        </div>
                        <div data-testid={`forecast-wind-speed-${idx}`}>
                            <strong>Windspeed:</strong> {entry.wind?.speed} m/s
                        </div>
                        {idx < forecast.length - 1 && (
                            <Separator my={3} data-testid={`forecast-separator-${idx}`} />
                        )}
                    </div>
                ))}
            </Box>
        </>
    );
}
