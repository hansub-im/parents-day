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
    name = "replies",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_replies_from_to",
        columnNames = {"from_recipient_id", "to_cousin_name"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_recipient_id", nullable = false, length = 50)
    private String fromRecipientId;

    /** Empty string means common (1:N) reply. */
    @Column(name = "to_cousin_name", nullable = false, length = 100)
    private String toCousinName;

    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
