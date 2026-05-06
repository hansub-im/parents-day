package com.parentsday.backend.controller;

import com.parentsday.backend.config.AdminAuth;
import com.parentsday.backend.entity.Letter;
import com.parentsday.backend.repository.LetterRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/letters")
@RequiredArgsConstructor
public class LetterController {

    private final LetterRepository repo;
    private final AdminAuth adminAuth;

    public record LetterUpsertRequest(
        String writerName,
        String writerFamilyId,
        String recipientId,
        String content
    ) {}

    @GetMapping
    public List<Letter> all() {
        return repo.findAll();
    }

    @PostMapping
    public Letter upsert(@RequestBody LetterUpsertRequest req) {
        Letter letter = repo
            .findByWriterNameAndRecipientId(req.writerName(), req.recipientId())
            .orElseGet(Letter::new);
        letter.setWriterName(req.writerName());
        letter.setWriterFamilyId(req.writerFamilyId());
        letter.setRecipientId(req.recipientId());
        letter.setContent(req.content());
        letter.setUpdatedAt(Instant.now());
        return repo.save(letter);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String adminPassword,
        @RequestParam("writer") String writer,
        @RequestParam("recipient") String recipient
    ) {
        adminAuth.require(adminPassword);
        repo.findByWriterNameAndRecipientId(writer, recipient).ifPresent(repo::delete);
        return ResponseEntity.noContent().build();
    }
}
