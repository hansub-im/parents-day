package com.parentsday.backend.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Component;

@Component
public class PinHasher {

    private static final String PREFIX = "sha256$";
    private final SecureRandom secureRandom = new SecureRandom();

    public String hash(String pin) {
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        byte[] digest = digest(salt, pin);
        return PREFIX
            + Base64.getUrlEncoder().withoutPadding().encodeToString(salt)
            + "$"
            + Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    }

    public boolean matches(String pin, String stored) {
        if (stored == null) {
            return false;
        }
        if (!stored.startsWith(PREFIX)) {
            return MessageDigest.isEqual(
                pin.getBytes(StandardCharsets.UTF_8),
                stored.getBytes(StandardCharsets.UTF_8)
            );
        }

        String[] parts = stored.split("\\$");
        if (parts.length != 3) {
            return false;
        }
        byte[] salt = Base64.getUrlDecoder().decode(parts[1]);
        byte[] expected = Base64.getUrlDecoder().decode(parts[2]);
        return MessageDigest.isEqual(digest(salt, pin), expected);
    }

    public boolean isHashed(String stored) {
        return stored != null && stored.startsWith(PREFIX);
    }

    private byte[] digest(byte[] salt, String pin) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(salt);
            md.update(pin.getBytes(StandardCharsets.UTF_8));
            return md.digest();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
