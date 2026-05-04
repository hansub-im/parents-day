package com.parentsday.backend.repository;

import com.parentsday.backend.entity.Letter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LetterRepository extends JpaRepository<Letter, Long> {

    Optional<Letter> findByWriterNameAndRecipientId(String writerName, String recipientId);

    List<Letter> findByRecipientIdOrderByUpdatedAtAsc(String recipientId);

    List<Letter> findByWriterName(String writerName);
}
