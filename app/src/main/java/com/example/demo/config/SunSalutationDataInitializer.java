package com.example.demo.config;

import java.util.List;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.repository.SunSalutationMasterRepository;

@Configuration
public class SunSalutationDataInitializer {

    @Bean
    ApplicationRunner initializeSunSalutationMaster(SunSalutationMasterRepository sunSalutationMasterRepository) {
        return args -> {
            List<String> defaultNames = List.of(
                    "太陽礼拝（ハーフ）",
                    "太陽礼拝A（軽減）",
                    "太陽礼拝A",
                    "太陽礼拝B（軽減）",
                    "太陽礼拝B",
                    "太陽礼拝C");

            for (int index = 0; index < defaultNames.size(); index += 1) {
                String name = defaultNames.get(index);
                if (!sunSalutationMasterRepository.existsByNameJa(name)) {
                    sunSalutationMasterRepository.save(name, index + 1);
                }
            }
        };
    }
}
