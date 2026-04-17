package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceBreathing(
        Long id,
        Long sequenceId,
        Long breathingMasterId,
        String breathingName,
        String breathingDescription,
        int displayOrder,
        String memo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
