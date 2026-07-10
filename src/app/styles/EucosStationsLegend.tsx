// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import type { LegendItemComponentProps } from "@open-pioneer/legend";
import { SectionHeading } from "@open-pioneer/react-utils";
import { EUCOS_STATION_STROKE, EUCOS_TYPE_COLORS, EUCOS_TYPE_LABELS } from "./eucosStyle";

// The EUCOS ground stations are now served as a WFS vector layer styled on the
// client, with one color per station "TYPE" attribute. The legend renders a
// swatch per type that matches the OpenLayers point style.
export function EucosStationsLegend({ layer }: LegendItemComponentProps) {
    return (
        <Box data-testid="eucos-stations-legend">
            <SectionHeading size="sm">{layer.title}</SectionHeading>
            <Stack gap={1} mt={2}>
                {Object.entries(EUCOS_TYPE_COLORS).map(([type, color]) => (
                    <Flex key={type} align="center" gap={2}>
                        <Box
                            as="span"
                            width="12px"
                            height="12px"
                            borderRadius="full"
                            bg={color}
                            border="1px solid"
                            borderColor={EUCOS_STATION_STROKE}
                            boxShadow="0 0 0 1px rgba(0, 0, 0, 0.2)"
                            flexShrink={0}
                        />
                        <Text fontSize="sm">
                            {EUCOS_TYPE_LABELS[Number(type)] ?? `Type ${type}`}
                        </Text>
                    </Flex>
                ))}
            </Stack>
        </Box>
    );
}
