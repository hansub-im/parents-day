package com.parentsday.backend.controller;

import com.parentsday.backend.config.AdminAuth;
import com.parentsday.backend.config.PinHasher;
import com.parentsday.backend.entity.CousinPin;
import com.parentsday.backend.repository.CousinPinRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pins")
@RequiredArgsConstructor
public class CousinPinController {

    private final CousinPinRepository repo;
    private final AdminAuth adminAuth;
    private final PinHasher pinHasher;

    public record PinPayload(String cousinName, String pin) {}

    @GetMapping("/{cousinName}/exists")
    public Map<String, Boolean> exists(@PathVariable String cousinName) {
        return Map.of("exists", repo.existsById(cousinName));
    }

    /** 처음 등록만 허용. 이미 있으면 false 반환 (반드시 verify 통과 후 reset). */
    @PostMapping("/set")
    public Map<String, Boolean> set(@RequestBody PinPayload req) {
        if (req.cousinName() == null || req.pin() == null) {
            return Map.of("ok", false);
        }
        if (repo.existsById(req.cousinName())) {
            return Map.of("ok", false, "alreadySet", true);
        }
        CousinPin p = CousinPin.builder()
            .cousinName(req.cousinName())
            .pin(pinHasher.hash(req.pin()))
            .updatedAt(Instant.now())
            .build();
        repo.save(p);
        return Map.of("ok", true);
    }

    @PostMapping("/verify")
    public Map<String, Boolean> verify(@RequestBody PinPayload req) {
        if (req.cousinName() == null || req.pin() == null) {
            return Map.of("ok", false);
        }
        return repo.findById(req.cousinName())
            .map(p -> {
                boolean ok = pinHasher.matches(req.pin(), p.getPin());
                if (ok && !pinHasher.isHashed(p.getPin())) {
                    p.setPin(pinHasher.hash(req.pin()));
                    p.setUpdatedAt(Instant.now());
                    repo.save(p);
                }
                return Map.of("ok", ok);
            })
            .orElseGet(() -> Map.of("ok", false));
    }

    /** 어드민용: PIN 잊은 사촌은 리셋해야 다시 설정 가능 */
    @DeleteMapping("/{cousinName}")
    public ResponseEntity<Void> reset(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String adminPassword,
        @PathVariable String cousinName
    ) {
        adminAuth.require(adminPassword);
        if (repo.existsById(cousinName)) {
            repo.deleteById(cousinName);
        }
        return ResponseEntity.noContent().build();
    }

    /** 어드민용: 모든 PIN 삭제 (깨진 데이터 청소용) */
    @DeleteMapping
    public ResponseEntity<Void> resetAll(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String adminPassword
    ) {
        adminAuth.require(adminPassword);
        repo.deleteAll();
        return ResponseEntity.noContent().build();
    }

    public record PinSummary(String cousinName, boolean set) {}

    /** 어드민용: PIN 설정한 사촌 이름. 값은 노출하지 않음. */
    @GetMapping
    public List<PinSummary> list(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String adminPassword
    ) {
        adminAuth.require(adminPassword);
        return repo.findAll().stream()
            .map(p -> new PinSummary(p.getCousinName(), true))
            .toList();
    }
}
