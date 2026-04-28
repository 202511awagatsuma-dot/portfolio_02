package com.example.demo.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.model.MoodLog;
import com.example.demo.repository.MoodLogRepository;

@Service
public class MoodLogService {

    private static final Set<String> ALLOWED_MOODS = Set.of("good", "normal", "tired");
    private static final int MAX_MEMO_LENGTH = 1000;

    private final MoodLogRepository moodLogRepository;

    public MoodLogService(MoodLogRepository moodLogRepository) {
        this.moodLogRepository = moodLogRepository;
    }

    public Optional<MoodLog> getTodayLog() {
        return moodLogRepository.findByDate(LocalDate.now());
    }

    public List<LocalDate> getLogDatesByMonth(YearMonth yearMonth) {
        LocalDate from = yearMonth.atDay(1);
        LocalDate to = yearMonth.atEndOfMonth();
        return moodLogRepository.findLogDatesInRange(from, to);
    }

    public MoodLog createToday(String mood, String memo) {
        String normalizedMood = normalizeMood(mood);
        String normalizedMemo = normalizeMemo(memo);
        LocalDate today = LocalDate.now();

        try {
            moodLogRepository.create(today, normalizedMood, normalizedMemo);
        } catch (DataIntegrityViolationException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "今日の気分ログはすでに登録されています。", error);
        }

        return moodLogRepository.findByDate(today)
                .orElseThrow(() -> new IllegalStateException("Failed to load created mood log."));
    }

    public MoodLog updateToday(String mood, String memo) {
        String normalizedMood = normalizeMood(mood);
        String normalizedMemo = normalizeMemo(memo);
        LocalDate today = LocalDate.now();
        int updatedRows = moodLogRepository.updateByDate(today, normalizedMood, normalizedMemo);

        if (updatedRows == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "今日の気分ログが見つかりません。");
        }

        return moodLogRepository.findByDate(today)
                .orElseThrow(() -> new IllegalStateException("Failed to load updated mood log."));
    }

    public void deleteToday() {
        LocalDate today = LocalDate.now();
        moodLogRepository.deleteByDate(today);
    }

    private String normalizeMood(String mood) {
        String normalizedMood = mood == null ? "" : mood.trim().toLowerCase();
        if (!ALLOWED_MOODS.contains(normalizedMood)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "気分は「良い・普通・疲れ気味」から選択してください。");
        }
        return normalizedMood;
    }

    private String normalizeMemo(String memo) {
        if (memo == null) {
            return null;
        }

        String normalizedMemo = memo.trim();
        if (normalizedMemo.isEmpty()) {
            return null;
        }

        if (normalizedMemo.length() > MAX_MEMO_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "メモは1000文字以内で入力してください。");
        }

        return normalizedMemo;
    }
}
