
package com.bugtracker.backend.dto;

import com.bugtracker.backend.entity.IssuePriority;
import com.bugtracker.backend.entity.IssueStatus;
import com.bugtracker.backend.entity.IssueType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class IssueResponse {

    private Long id;
    private String title;
    private String description;
    private IssueType type;
    private IssuePriority priority;
    private IssueStatus status;
    private Long projectId;
    private String projectName;
    private Long reporterId;
    private String reporterName;
    private Long assigneeId;
    private String assigneeName;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
