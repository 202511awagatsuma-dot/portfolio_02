package com.example.demo.model;

import java.time.LocalDateTime;

public record SequencePeakPose(
        Long id,
        Long sequenceId,
        Long peakPoseMasterId,
        String customName,
        String displayName,
        int sortOrder,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
