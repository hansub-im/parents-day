package com.parentsday.backend.repository;

import com.parentsday.backend.entity.Reply;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    Optional<Reply> findByFromRecipientIdAndToCousinName(
        String fromRecipientId,
        String toCousinName
    );
}
