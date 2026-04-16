package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.repository.BreathingMasterRepository;
import com.example.demo.service.BreathingService;

@Configuration
public class BreathingDataInitializer {

    @Bean
    ApplicationRunner initializeBreathingMaster(BreathingMasterRepository breathingMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "腹式呼吸",
                    "胸式呼吸",
                    "完全呼吸",
                    "片鼻呼吸（ナディーショーダナー）");

            for (String name : defaultNames) {
                if (!breathingMasterRepository.existsByNameAndCategory(name, BreathingService.BREATHING_CATEGORY)) {
                    breathingMasterRepository.save(name, BreathingService.BREATHING_CATEGORY, null);
                }
            }
        };
    }
}
