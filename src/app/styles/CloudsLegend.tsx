// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@chakra-ui/react";
import type { LegendItemComponentProps } from "@open-pioneer/legend";
import { SectionHeading } from "@open-pioneer/react-utils";

const CLOUD_COVER_STOPS = [
    { value: 0, color: "rgba(255, 255, 255, 0.0)" },
    { value: 10, color: "rgba(253, 253, 255, 0.1)" },
    { value: 20, color: "rgba(252, 251, 255, 0.2)" },
    { value: 30, color: "rgba(250, 250, 255, 0.3)" },
    { value: 40, color: "rgba(249, 248, 255, 0.4)" },
    { value: 50, color: "rgba(247, 247, 255, 0.5)" },
    { value: 60, color: "rgba(246, 245, 255, 0.75)" },
    { value: 70, color: "rgba(244, 244, 255, 1)" },
    { value: 80, color: "rgba(243, 242, 255, 1)" },
    { value: 90, color: "rgba(242, 241, 255, 1)" },
    { value: 100, color: "rgba(240, 240, 255, 1)" }
];

function buildGradient() {
    const min = CLOUD_COVER_STOPS[0]?.value ?? 0;
    const max = CLOUD_COVER_STOPS[CLOUD_COVER_STOPS.length - 1]?.value ?? 0;
    const range = Math.max(max - min, 1);

    const parts = CLOUD_COVER_STOPS.map((stop) => {
        const percent = ((stop.value - min) / range) * 100;
        return `${stop.color} ${percent.toFixed(2)}%`;
    });

    return `linear-gradient(90deg, ${parts.join(", ")})`;
}

export function CloudsLegend({ layer }: LegendItemComponentProps) {
    const labels = [0, 25, 50, 75, 100];

    return (
        <Box>
            <SectionHeading size="sm">{layer.title} (%)</SectionHeading>
            <Box
                borderRadius="sm"
                borderWidth="1px"
                height="14px"
                bgImage={buildGradient()}
                mt={2}
            />
            <Box position="relative" height="16px" mt={1}>
                {labels.map((value) => {
                    const percent = value;
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
                            {value}
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
}
