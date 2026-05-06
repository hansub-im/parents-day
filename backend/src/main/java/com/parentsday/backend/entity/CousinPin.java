package com.parentsday.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "cousin_pins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CousinPin {

    @Id
    @Nationalized
    @Column(name = "cousin_name", columnDefinition = "NVARCHAR(100)")
    private String cousinName;

    @Column(name = "pin", nullable = false, length = 128)
    private String pin;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
