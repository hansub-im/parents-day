package com.parentsday.backend.repository;

import com.parentsday.backend.entity.Photo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

    List<Photo> findAllByOrderByCreatedAtAsc();
}
