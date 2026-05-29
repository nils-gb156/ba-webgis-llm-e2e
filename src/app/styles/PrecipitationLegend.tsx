// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@chakra-ui/react";
import type { LegendItemComponentProps } from "@open-pioneer/legend";
import { SectionHeading } from "@open-pioneer/react-utils";

const Precipitation_STOPS = [
    { value: 0, color: "rgba(225, 200, 100, 0)" },
    { value: 0.1, color: "rgba(200, 150, 150, 0)" },
    { value: 0.2, color: "rgba(150, 150, 170, 0)" },
    { value: 0.5, color: "rgba(120, 120, 190, 0)" },
    { value: 1, color: "rgba(110, 110, 205, 0.3)" },
    { value: 10, color: "rgba(80, 80, 225, 0.7)" },
    { value: 140, color: "rgba(20, 20, 255, 0.9)" }
];

function buildGradient() {
    const min = Precipitation_STOPS[0]?.value ?? 0;
    const max = Precipitation_STOPS[Precipitation_STOPS.length - 1]?.value ?? 0;
    const range = Math.max(max - min, 1);

    const parts = Precipitation_STOPS.map((stop) => {
        const percent = ((stop.value - min) / range) * 100;
        return `${stop.color} ${percent.toFixed(2)}%`;
    });

    return `linear-gradient(90deg, ${parts.join(", ")})`;
}

export function PrecipitationLegend({ layer }: LegendItemComponentProps) {
    const min = Precipitation_STOPS[0]?.value ?? 0;
    const max = Precipitation_STOPS[Precipitation_STOPS.length - 1]?.value ?? 0;
    const labels = [0, 50, 100, 150];

    function formatLabel(value: number) {
        if (Number.isNaN(value)) {
            return "";
        }
        if (Number.isInteger(value)) {
            return value.toFixed(0);
        }
        return value.toFixed(2);
    }

    return (
        <Box>
            <SectionHeading size="sm">{layer.title} (mm)</SectionHeading>
            <Box
                borderRadius="sm"
                borderWidth="1px"
                height="14px"
                bgImage={buildGradient()}
                mt={2}
            />
            <Box position="relative" height="16px" mt={1}>
                {labels.map((value) => {
                    const percent = (value / 150) * 100;
                    const isFirst = value === labels[0];
                    const isLast = value === labels[labels.length - 1];

                    return (
                        <Text
                            key={value}
                            position="absolute"
                            left={`${percent}%`}
                            transform={
                                isFirst ? "none" : isLast ? "translateX(-100%)" : "translateX(-50%)"
                            }
                            fontSize="xs"
                            whiteSpace="nowrap"
                        >
                            {formatLabel(value)}
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
}
