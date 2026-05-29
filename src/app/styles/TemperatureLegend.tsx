// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import type { LegendItemComponentProps } from "@open-pioneer/legend";
import { SectionHeading } from "@open-pioneer/react-utils";

const TEMPERATURE_STOPS = [
    { value: -65, color: "rgba(130, 22, 146, 1)" },
    { value: -55, color: "rgba(130, 22, 146, 1)" },
    { value: -45, color: "rgba(130, 22, 146, 1)" },
    { value: -40, color: "rgba(130, 22, 146, 1)" },
    { value: -30, color: "rgba(130, 87, 219, 1)" },
    { value: -20, color: "rgba(32, 140, 236, 1)" },
    { value: -10, color: "rgba(32, 196, 232, 1)" },
    { value: 0, color: "rgba(35, 221, 221, 1)" },
    { value: 10, color: "rgba(194, 255, 40, 1)" },
    { value: 20, color: "rgba(255, 240, 40, 1)" },
    { value: 25, color: "rgba(255, 194, 40, 1)" },
    { value: 30, color: "rgba(252, 128, 20, 1)" }
];

export function TemperatureLegend({ layer }: LegendItemComponentProps) {
    const ranges = TEMPERATURE_STOPS.slice(0, -1)
        .map((stop, index) => {
            const next = TEMPERATURE_STOPS[index + 1];
            if (!next) {
                return undefined;
            }
            return {
                from: stop.value,
                to: next.value,
                color: next.color
            };
        })
        .filter((range): range is { from: number; to: number; color: string } => !!range);

    return (
        <Box>
            <SectionHeading size="sm">{layer.title} (°C)</SectionHeading>
            <VStack align="stretch" gap={1} mt={2}>
                {ranges.map((range) => (
                    <LegendRow
                        key={`${range.from}-${range.to}`}
                        color={range.color}
                        label={`${range.from} - ${range.to}`}
                    />
                ))}
            </VStack>
        </Box>
    );
}

function LegendRow(props: { color: string; label: string }) {
    const { color, label } = props;

    return (
        <HStack align="center" gap={3}>
            <Box
                borderRadius="sm"
                width="22px"
                height="16px"
                backgroundColor={color}
                border="1px solid rgba(255, 255, 255, 0.9)"
                boxShadow="0 0 0 1px rgba(94, 94, 94, 0.25) inset"
            />
            <Text fontSize="sm">{label}</Text>
        </HStack>
    );
}
