
package com.bugtracker.backend.controller;

import com.bugtracker.backend.dto.IssueRequest;
import com.bugtracker.backend.dto.IssueResponse;
import com.bugtracker.backend.entity.IssuePriority;
import com.bugtracker.backend.entity.IssueStatus;
import com.bugtracker.backend.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IssueResponse createIssue(
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return issueService.createIssue(request, user.getUsername());
    }

    @GetMapping("/project/{projectId}")
    public List<IssueResponse> getProjectIssues(
            @PathVariable Long projectId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssuePriority priority,
            @RequestParam(required = false) Long assigneeId,
            @AuthenticationPrincipal UserDetails user) {

        return issueService.getProjectIssues(
                projectId, user.getUsername(), status, priority, assigneeId);
    }

    @GetMapping("/{id}")
    public IssueResponse getIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return issueService.getIssue(id, user.getUsername());
    }

    @PutMapping("/{id}")
    public IssueResponse updateIssue(
            @PathVariable Long id,
            @Valid @RequestBody IssueRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return issueService.updateIssue(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteIssue(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        issueService.deleteIssue(id, user.getUsername());
    }
}
