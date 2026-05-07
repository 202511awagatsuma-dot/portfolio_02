package com.example.demo.controller;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index(Model model) {
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy.MM.dd(E)", Locale.JAPANESE);
        String currentMonthLabel = String.format("%d年%d月", today.getYear(), today.getMonthValue());
        List<Integer> initialCalendarCells = buildInitialCalendarCells(today);

        model.addAttribute("today", today.format(formatter));
        model.addAttribute("currentMonthLabel", currentMonthLabel);
        model.addAttribute("initialCalendarCells", initialCalendarCells);
        model.addAttribute("scriptVersion", System.currentTimeMillis());
        model.addAttribute("todayMessage", "スティタスを整えて、毎日もやさしく積み上げましょう。");

        return "index";
    }

    private List<Integer> buildInitialCalendarCells(LocalDate date) {
        YearMonth yearMonth = YearMonth.of(date.getYear(), date.getMonthValue());
        int firstDay = LocalDate.of(date.getYear(), date.getMonthValue(), 1).getDayOfWeek().getValue() % 7;
        int lastDate = yearMonth.lengthOfMonth();
        int totalCells = ((firstDay + lastDate + 6) / 7) * 7;
        List<Integer> cells = new ArrayList<>(totalCells);

        for (int cellIndex = 0; cellIndex < totalCells; cellIndex += 1) {
            int day = cellIndex - firstDay + 1;
            if (day >= 1 && day <= lastDate) {
                cells.add(day);
            } else {
                cells.add(null);
            }
        }

        return cells;
    }
}
