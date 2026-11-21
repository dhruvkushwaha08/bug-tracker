
package com.bugtracker.backend.dto;

import com.bugtracker.backend.entity.IssuePriority;
import com.bugtracker.backend.entity.IssueStatus;
import com.bugtracker.backend.entity.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class IssueRequest {

    @NotNull
    private Long projectId;

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 2000)
    private String description;

    private IssueType type = IssueType.BUG;
    private IssuePriority priority = IssuePriority.MEDIUM;
    private IssueStatus status = IssueStatus.TODO;

    private Long assigneeId;
    private LocalDate dueDate;
}
