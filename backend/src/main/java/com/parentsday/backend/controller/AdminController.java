package com.parentsday.backend.controller;

import com.parentsday.backend.config.AdminAuth;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminAuth adminAuth;

    @GetMapping("/verify")
    public Map<String, Boolean> verify(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String password
    ) {
        return Map.of("ok", adminAuth.isValid(password));
    }
}
