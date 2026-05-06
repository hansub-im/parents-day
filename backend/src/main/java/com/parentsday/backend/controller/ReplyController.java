package com.parentsday.backend.controller;

import com.parentsday.backend.config.AdminAuth;
import com.parentsday.backend.entity.Reply;
import com.parentsday.backend.repository.ReplyRepository;
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
@RequestMapping("/api/replies")
@RequiredArgsConstructor
public class ReplyController {

    private final ReplyRepository repo;
    private final AdminAuth adminAuth;

    public record ReplyUpsertRequest(
        String fromRecipientId,
        String toCousinName,
        String content
    ) {}

    @GetMapping
    public List<Reply> all() {
        return repo.findAll();
    }

    @PostMapping
    public Reply upsert(@RequestBody ReplyUpsertRequest req) {
        String to = req.toCousinName() == null ? "" : req.toCousinName();
        Reply reply = repo
            .findByFromRecipientIdAndToCousinName(req.fromRecipientId(), to)
            .orElseGet(Reply::new);
        reply.setFromRecipientId(req.fromRecipientId());
        reply.setToCousinName(to);
        reply.setContent(req.content());
        reply.setUpdatedAt(Instant.now());
        return repo.save(reply);
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String adminPassword,
        @RequestParam("recipient") String recipient,
        @RequestParam(value = "cousin", required = false) String cousin
    ) {
        adminAuth.require(adminPassword);
        String to = cousin == null ? "" : cousin;
        repo.findByFromRecipientIdAndToCousinName(recipient, to).ifPresent(repo::delete);
        return ResponseEntity.noContent().build();
    }
}
