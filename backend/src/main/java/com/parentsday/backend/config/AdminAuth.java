package com.parentsday.backend.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AdminAuth {

    public static final String HEADER_NAME = "X-Admin-Pass";

    @Value("${app.admin.password}")
    private String adminPassword;

    public boolean isValid(String password) {
        if (password == null || password.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
            password.getBytes(StandardCharsets.UTF_8),
            adminPassword.getBytes(StandardCharsets.UTF_8)
        );
    }

    public void require(String password) {
        if (!isValid(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin password required");
        }
    }
}
