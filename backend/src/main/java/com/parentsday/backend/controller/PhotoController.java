package com.parentsday.backend.controller;

import com.parentsday.backend.config.AdminAuth;
import com.parentsday.backend.entity.Photo;
import com.parentsday.backend.repository.PhotoRepository;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoRepository repo;
    private final AdminAuth adminAuth;

    public record PhotoMeta(
        Long id,
        String uploaderName,
        String uploaderFamilyId,
        String caption,
        String recipientIds,
        Instant createdAt
    ) {
        static PhotoMeta from(Photo p) {
            return new PhotoMeta(
                p.getId(),
                p.getUploaderName(),
                p.getUploaderFamilyId(),
                p.getCaption(),
                p.getRecipientIds(),
                p.getCreatedAt()
            );
        }
    }

    public record PhotoUploadMeta(
        String uploaderName,
        String uploaderFamilyId,
        String caption,
        String recipientIds
    ) {}

    @GetMapping
    public List<PhotoMeta> list() {
        return repo.findAllByOrderByCreatedAtAsc().stream()
            .map(PhotoMeta::from)
            .toList();
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> image(@PathVariable Long id) {
        return repo.findById(id)
            .map(p -> ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .contentType(MediaType.parseMediaType(p.getContentType()))
                .body(p.getImageData()))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public PhotoMeta upload(
        @RequestPart("file") MultipartFile file,
        @RequestPart("meta") PhotoUploadMeta meta
    ) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Empty file");
        }
        Photo p = Photo.builder()
            .uploaderName(meta.uploaderName())
            .uploaderFamilyId(meta.uploaderFamilyId())
            .caption(meta.caption())
            .recipientIds(meta.recipientIds())
            .contentType(file.getContentType() != null ? file.getContentType() : "image/jpeg")
            .imageData(file.getBytes())
            .createdAt(Instant.now())
            .build();
        return PhotoMeta.from(repo.save(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @RequestHeader(value = AdminAuth.HEADER_NAME, required = false) String adminPassword,
        @PathVariable Long id,
        @RequestParam(value = "uploader", required = false) String uploader
    ) {
        Photo photo = repo.findById(id).orElse(null);
        if (photo == null) {
            return ResponseEntity.noContent().build();
        }
        if (!adminAuth.isValid(adminPassword) && !photo.getUploaderName().equals(uploader)) {
            adminAuth.require(adminPassword);
        }
        repo.delete(photo);
        return ResponseEntity.noContent().build();
    }
}
