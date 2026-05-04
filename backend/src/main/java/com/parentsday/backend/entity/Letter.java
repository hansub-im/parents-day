package com.parentsday.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "letters",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_letters_writer_recipient",
        columnNames = {"writer_name", "recipient_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Letter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "writer_name", nullable = false, length = 100)
    private String writerName;

    @Column(name = "writer_family_id", length = 20)
    private String writerFamilyId;

    @Column(name = "recipient_id", nullable = false, length = 50)
    private String recipientId;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
