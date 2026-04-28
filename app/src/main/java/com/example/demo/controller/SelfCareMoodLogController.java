package com.example.demo.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DateTimeException;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.MoodLog;
import com.example.demo.service.MoodLogService;

@RestController
@RequestMapping("/api/self-care/mood-logs")
public class SelfCareMoodLogController {

    private final MoodLogService moodLogService;

    public SelfCareMoodLogController(MoodLogService moodLogService) {
        this.moodLogService = moodLogService;
    }

    @GetMapping("/today")
    public MoodLogResponse getTodayMoodLog() {
        LocalDate today = LocalDate.now();
        Optional<MoodLog> todayLog = moodLogService.getTodayLog();

        if (todayLog.isEmpty()) {
            return MoodLogResponse.empty(today);
        }

        return MoodLogResponse.from(todayLog.get());
    }

    @GetMapping("/month")
    public MoodLogMonthResponse getMonthMoodLogDates(
            @RequestParam int year,
            @RequestParam int month) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be between 1 and 12.");
        }

        YearMonth yearMonth;
        try {
            yearMonth = YearMonth.of(year, month);
        } catch (DateTimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid year or month.");
        }
        List<LocalDate> dates = moodLogService.getLogDatesByMonth(yearMonth);
        return new MoodLogMonthResponse(year, month, dates);
    }

    @PostMapping("/today")
    public MoodLogResponse createTodayMoodLog(@RequestBody MoodLogSaveRequest request) {
        MoodLog created = moodLogService.createToday(request.mood(), request.memo());
        return MoodLogResponse.from(created);
    }

    @PutMapping("/today")
    public MoodLogResponse updateTodayMoodLog(@RequestBody MoodLogSaveRequest request) {
        MoodLog updated = moodLogService.updateToday(request.mood(), request.memo());
        return MoodLogResponse.from(updated);
    }

    @DeleteMapping("/today")
    public ResponseEntity<Void> deleteTodayMoodLog() {
        moodLogService.deleteToday();
        return ResponseEntity.noContent().build();
    }

    public record MoodLogSaveRequest(String mood, String memo) {
    }

    public record MoodLogMonthResponse(int year, int month, List<LocalDate> dates) {
    }

    public record MoodLogResponse(
            boolean exists,
            Long id,
            LocalDate date,
            String mood,
            String memo,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        static MoodLogResponse from(MoodLog moodLog) {
            return new MoodLogResponse(
                    true,
                    moodLog.id(),
                    moodLog.logDate(),
                    moodLog.mood(),
                    moodLog.memo(),
                    moodLog.createdAt(),
                    moodLog.updatedAt());
        }

        static MoodLogResponse empty(LocalDate date) {
            return new MoodLogResponse(false, null, date, null, null, null, null);
        }
    }
}
