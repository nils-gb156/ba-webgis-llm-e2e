// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Stack, Text } from "@chakra-ui/react";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { WeatherForecast } from "./WeatherForecast";
import { UviStationInfo, type UviFeatureInfo } from "./UviStationInfo";
import { EucosStationInfo, type EucosFeatureInfo } from "./EucosStationInfo";

export interface InfoPanelProps {
    coordinate?: [number, number];
    uviFeatureInfo?: UviFeatureInfo;
    eucosFeatureInfo?: EucosFeatureInfo;
}

export function InfoPanel({ coordinate, uviFeatureInfo, eucosFeatureInfo }: InfoPanelProps) {
    const showUviInfo = uviFeatureInfo?.status === "json" || uviFeatureInfo?.status === "text";
    const showEucosInfo =
        eucosFeatureInfo?.status === "json" || eucosFeatureInfo?.status === "text";

    return (
        <TitledSection title={<SectionHeading size="md">Information</SectionHeading>}>
            <Stack gap={5}>
                <Box>
                    <SectionHeading size="sm">Weather Forecast</SectionHeading>
                    <Box mt={2}>
                        {coordinate ? (
                            <WeatherForecast coordinate={coordinate} />
                        ) : (
                            <Text fontSize="sm" color="gray.600">
                                Click on the map to load a forecast.
                            </Text>
                        )}
                    </Box>
                </Box>

                {showUviInfo && (
                    <Box>
                        <SectionHeading size="sm">UV-Index Station</SectionHeading>
                        <Box mt={2}>
                            <UviStationInfo uviFeatureInfo={uviFeatureInfo} />
                        </Box>
                    </Box>
                )}

                {showEucosInfo && (
                    <Box>
                        <SectionHeading size="sm">EUCOS Ground Station</SectionHeading>
                        <Box mt={2}>
                            <EucosStationInfo eucosFeatureInfo={eucosFeatureInfo} />
                        </Box>
                    </Box>
                )}
            </Stack>
        </TitledSection>
    );
}
