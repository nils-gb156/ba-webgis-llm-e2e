// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, Text } from "@chakra-ui/react";
import type { MapModel } from "@open-pioneer/map";
import { transform } from "ol/proj";

type NominatimResult = {
    display_name?: string;
    lat?: string;
    lon?: string;
};

export interface GeocoderSearchProps {
    map: MapModel;
    onSelect?: (selection: {
        coordinate: [number, number];
        mapCoordinate: [number, number];
        label?: string;
    }) => void;
}

export function GeocoderSearch({ map, onSelect }: GeocoderSearchProps) {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const skipNextSearchRef = useRef<boolean>(false);

    const emailParam = useMemo(() => {
        const email = import.meta.env.VITE_NOMINATIM_EMAIL as string | undefined;
        return email ? `&email=${encodeURIComponent(email)}` : "";
    }, []);

    useEffect(() => {
        if (skipNextSearchRef.current) {
            skipNextSearchRef.current = false;
            setResults([]);
            setIsOpen(false);
            return;
        }

        const trimmed = query.trim();
        if (trimmed.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
            setIsLoading(true);
            fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(
                    trimmed
                )}${emailParam}`,
                { signal: controller.signal }
            )
                .then((res) => res.json())
                .then((data: NominatimResult[]) => {
                    setResults(Array.isArray(data) ? data : []);
                    setIsOpen(true);
                })
                .catch(() => {
                    setResults([]);
                    setIsOpen(false);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }, 300);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [query, emailParam]);

    function selectResult(result: NominatimResult) {
        if (!result.lat || !result.lon) {
            return;
        }

        const lon = Number(result.lon);
        const lat = Number(result.lat);
        if (Number.isNaN(lon) || Number.isNaN(lat)) {
            return;
        }

        const view = map.olMap.getView();
        const target = transform([lon, lat], "EPSG:4326", view.getProjection());
        view.animate({ center: target, zoom: Math.max(view.getZoom() ?? 13, 13), duration: 400 });

        if (Array.isArray(target) && target.length >= 2) {
            onSelect?.({
                coordinate: [lat, lon],
                mapCoordinate: target as [number, number],
                label: result.display_name
            });
        }

        skipNextSearchRef.current = true;
        setQuery(result.display_name ?? "");
        setIsOpen(false);
        setResults([]);
    }

    return (
        <Box w="360px">
            <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a place"
                size="sm"
                backgroundColor="white"
                aria-label="Geocoder search"
            />
            {isOpen && results.length > 0 && (
                <Box mt={2} borderWidth="1px" borderRadius="md" overflow="hidden">
                    <Box role="list">
                        {results.map((result, index) => (
                            <Box
                                key={`${result.display_name ?? "result"}-${index}`}
                                px={3}
                                py={2}
                                cursor="pointer"
                                _hover={{ backgroundColor: "gray.50" }}
                                onClick={() => selectResult(result)}
                                role="listitem"
                            >
                                <Text
                                    fontSize="sm"
                                    style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    }}
                                >
                                    {result.display_name ?? "Unknown location"}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
            {isOpen && !results.length && !isLoading && (
                <Text fontSize="sm" mt={2} color="gray.600">
                    No results found.
                </Text>
            )}
        </Box>
    );
}
