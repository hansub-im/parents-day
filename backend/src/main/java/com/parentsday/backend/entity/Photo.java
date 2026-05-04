package com.parentsday.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Nationalized
    @Column(name = "uploader_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String uploaderName;

    @Column(name = "uploader_family_id", length = 20)
    private String uploaderFamilyId;

    @Nationalized
    @Column(columnDefinition = "NVARCHAR(200)")
    private String caption;

    /**
     * Comma-separated list of recipient ids the photo is tagged for
     * (e.g. "big-dad,big-mom"). Empty/null means show on all home pages.
     */
    @Column(name = "recipient_ids", length = 500)
    private String recipientIds;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Lob
    @Column(name = "image_data", nullable = false, columnDefinition = "VARBINARY(MAX)")
    private byte[] imageData;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
