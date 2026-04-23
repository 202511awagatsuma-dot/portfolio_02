package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.repository.RelaxationMasterRepository;

@Configuration
public class RelaxationDataInitializer {

    @Bean
    ApplicationRunner initializeRelaxationMaster(RelaxationMasterRepository relaxationMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "\u30a2\u30d1\u30ca\u30fc\u30b5\u30ca",
                    "\u30b7\u30e3\u30d0\u30fc\u30b5\u30ca",
                    "\u30d0\u30fc\u30e9\u30fc\u30b5\u30ca",
                    "\u30b9\u30d7\u30bf\u0020\u30d0\u30c3\u30c0\u0020\u30b3\u30fc\u30ca\u30fc\u30b5\u30ca",
                    "\u30b8\u30e3\u30bf\u30e9\u0020\u30d1\u30ea\u30f4\u30a1\u30eb\u30bf\u30fc\u30ca\u30fc\u30b5\u30ca",
                    "\u30f4\u30a3\u30d1\u30ea\u30fc\u30bf\u0020\u30ab\u30e9\u30cb");

            for (int index = 0; index < defaultNames.size(); index += 1) {
                String name = defaultNames.get(index);
                if (!relaxationMasterRepository.existsByNameJa(name)) {
                    relaxationMasterRepository.save(name, index + 1);
                }
            }
        };
    }
}
