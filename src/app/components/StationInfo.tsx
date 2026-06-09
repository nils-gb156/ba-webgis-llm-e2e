// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Separator, SimpleGrid, Stack, Text } from "@chakra-ui/react";

export type StationFeatureInfo =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "empty" }
    | { status: "error"; message: string }
    | { status: "text"; content: string }
    | { status: "json"; features: { id?: string; properties: Record<string, unknown> }[] };

export interface StationInfoProps {
    featureInfo?: StationFeatureInfo;
    /** Ordered list of attribute keys to display. */
    attributeOrder: readonly string[];
    /** Map of attribute keys to human-readable labels. */
    attributeLabels: Record<string, string>;
    /** Message shown while the component is idle (e.g. "Click on a UVI station ..."). */
    idleMessage: string;
}

function formatValue(value: unknown): string {
    if (value == null) {
        return "-";
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function StationInfo({
    featureInfo,
    attributeOrder,
    attributeLabels,
    idleMessage
}: StationInfoProps) {
    if (!featureInfo || featureInfo.status === "idle") {
        return (
            <Text fontSize="sm" color="gray.600">
                {idleMessage}
            </Text>
        );
    }

    if (featureInfo.status === "loading") {
        return (
            <Text fontSize="sm" color="gray.600">
                Loading station info...
            </Text>
        );
    }

    if (featureInfo.status === "error") {
        return (
            <Text fontSize="sm" color="red.600">
                {featureInfo.message}
            </Text>
        );
    }

    if (featureInfo.status === "empty") {
        return (
            <Text fontSize="sm" color="gray.600">
                No station at this location.
            </Text>
        );
    }

    if (featureInfo.status === "text") {
        return (
            <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={3} bg="gray.50">
                <Text fontSize="sm" whiteSpace="pre-wrap">
                    {featureInfo.content}
                </Text>
            </Box>
        );
    }

    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            p={3}
            maxHeight="200px"
            overflowY="auto"
            bg="gray.50"
        >
            <Stack gap={3}>
                {featureInfo.features.map((feature, featureIndex) => (
                    <Box key={feature.id ?? featureIndex}>
                        {Object.entries(feature.properties).length ? (
                            <SimpleGrid columns={2} columnGap={4} rowGap={1}>
                                {attributeOrder
                                    .filter((key) => key in feature.properties)
                                    .flatMap((key) => [
                                        <Text key={`${key}-label`} fontSize="sm" color="gray.600">
                                            {attributeLabels[key] ?? key}
                                        </Text>,
                                        <Text
                                            key={`${key}-value`}
                                            fontSize="sm"
                                            wordBreak="break-word"
                                        >
                                            {formatValue(feature.properties[key])}
                                        </Text>
                                    ])}
                            </SimpleGrid>
                        ) : (
                            <Text fontSize="sm" color="gray.600">
                                No attribute data available.
                            </Text>
                        )}
                        {featureIndex < featureInfo.features.length - 1 && <Separator mt={3} />}
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
