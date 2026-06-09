// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Input, Text } from "@chakra-ui/react";
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

// Free-text place search backed by the OpenStreetMap Nominatim API. On select
// it pans/zooms the map to the chosen location and notifies the parent.
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
        // After selecting a result we set the input to its label; skip the search
        // that this programmatic change would otherwise trigger.
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

        // Debounce the request (300 ms) and abort it on cleanup so fast typing
        // does not spam the Nominatim API.
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

        // Animate the map to the selected place (project lat/lon into the map's CRS).
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

    function clearQuery() {
        skipNextSearchRef.current = true;
        setQuery("");
        setResults([]);
        setIsOpen(false);
    }

    return (
        <Box w="360px">
            <Box position="relative">
                <Input
                    data-testid="geocoder-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search for a place"
                    size="sm"
                    backgroundColor="white"
                    aria-label="Geocoder search"
                    pr={query ? "2rem" : undefined}
                />
                {query && (
                    <Button
                        type="button"
                        variant="ghost"
                        data-testid="geocoder-clear-button"
                        position="absolute"
                        top="50%"
                        right="0.5rem"
                        transform="translateY(-50%)"
                        minWidth="auto"
                        padding={0}
                        width="1.25rem"
                        height="1.25rem"
                        borderRadius="full"
                        color="gray.500"
                        _hover={{ backgroundColor: "gray.100", color: "gray.700" }}
                        onClick={clearQuery}
                        aria-label="Clear search"
                    >
                        ✕
                    </Button>
                )}
            </Box>
            {isOpen && results.length > 0 && (
                <Box mt={2} borderWidth="1px" borderRadius="md" overflow="hidden">
                    <Box data-testid="geocoder-results" role="list">
                        {results.map((result, index) => (
                            <Box
                                key={`${result.display_name ?? "result"}-${index}`}
                                data-testid={`geocoder-result-item-${index}`}
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
