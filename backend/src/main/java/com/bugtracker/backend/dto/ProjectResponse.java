
package com.bugtracker.backend.dto;

import com.bugtracker.backend.entity.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ProjectResponse {

    private Long id;
    private String name;
    private String projectKey;
    private String description;
    private ProjectStatus status;
    private String ownerName;
    private LocalDateTime createdAt;
}
