package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.repository.SeatedMasterRepository;

@Configuration
public class SeatedDataInitializer {

    @Bean
    ApplicationRunner initializeSeatedMaster(SeatedMasterRepository seatedMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "\u30c0\u30f3\u30c0\u30fc\u30b5\u30ca",
                    "\u30b9\u30ab\u30fc\u30b5\u30ca",
                    "\u30f4\u30a1\u30b8\u30e5\u30e9\u30fc\u30b5\u30ca",
                    "\u30d0\u30c3\u30c0\u0020\u30b3\u30fc\u30ca\u30fc\u30b5\u30ca",
                    "\u30b8\u30e3\u30fc\u30cc\u30b7\u30eb\u30b7\u30e3\u30fc\u30b5\u30ca",
                    "\u30d1\u30b7\u30e5\u30c1\u30e2\u30c3\u30bf\u30fc\u30ca\u30fc\u30b5\u30ca",
                    "\u30b4\u30fc\u30e0\u30ab\u30fc\u30b5\u30ca",
                    "\u30a2\u30eb\u30c0\u0020\u30de\u30c4\u30a7\u30fc\u30f3\u30c9\u30e9\u30fc\u30b5\u30ca");

            for (int index = 0; index < defaultNames.size(); index += 1) {
                String name = defaultNames.get(index);
                if (!seatedMasterRepository.existsByNameJa(name)) {
                    seatedMasterRepository.save(name, index + 1);
                }
            }
        };
    }
}
