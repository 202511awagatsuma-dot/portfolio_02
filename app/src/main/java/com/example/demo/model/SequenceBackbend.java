package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceBackbend(
        Long id,
        Long sequenceId,
        Long backbendMasterId,
        String customName,
        String displayName,
        int sortOrder,
        String memo,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
