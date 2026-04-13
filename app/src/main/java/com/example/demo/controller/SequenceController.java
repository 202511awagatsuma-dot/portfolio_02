package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SequenceController {

    @GetMapping("/sequence/setup")
    public String setup() {
        return "sequence-setup";
    }

    @GetMapping("/sequence/edit")
    public String edit() {
        return "sequence-edit";
    }
}
