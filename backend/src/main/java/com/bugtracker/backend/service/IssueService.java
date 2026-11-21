
package com.bugtracker.backend.service;

import com.bugtracker.backend.dto.IssueRequest;
import com.bugtracker.backend.dto.IssueResponse;
import com.bugtracker.backend.entity.*;
import com.bugtracker.backend.repository.IssueRepository;
import com.bugtracker.backend.repository.ProjectRepository;
import com.bugtracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public IssueResponse createIssue(IssueRequest request, String email) {
        User reporter = getUser(email);
        Project project = getProject(request.getProjectId());
        verifyOwnership(project, reporter);

        Issue issue = new Issue();
        issue.setTitle(request.getTitle().trim());
        issue.setDescription(request.getDescription());
        issue.setType(request.getType() == null ? IssueType.BUG : request.getType());
        issue.setPriority(request.getPriority() == null
                ? IssuePriority.MEDIUM : request.getPriority());
        issue.setStatus(request.getStatus() == null
                ? IssueStatus.TODO : request.getStatus());
        issue.setProject(project);
        issue.setReporter(reporter);
        issue.setDueDate(request.getDueDate());

        if (request.getAssigneeId() != null) {
            issue.setAssignee(getUserById(request.getAssigneeId()));
        }

        return toResponse(issueRepository.save(issue));
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> getProjectIssues(
            Long projectId,
            String email,
            IssueStatus status,
            IssuePriority priority,
            Long assigneeId) {

        User user = getUser(email);
        Project project = getProject(projectId);
        verifyOwnership(project, user);

        Stream<Issue> issues = issueRepository.findByProjectId(projectId).stream();

        if (status != null) {
            issues = issues.filter(issue -> issue.getStatus() == status);
        }

        if (priority != null) {
            issues = issues.filter(issue -> issue.getPriority() == priority);
        }

        if (assigneeId != null) {
            issues = issues.filter(issue -> issue.getAssignee() != null
                    && issue.getAssignee().getId().equals(assigneeId));
        }

        return issues.map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public IssueResponse getIssue(Long issueId, String email) {
        return toResponse(getOwnedIssue(issueId, email));
    }

    @Transactional
    public IssueResponse updateIssue(
            Long issueId, IssueRequest request, String email) {

        Issue issue = getOwnedIssue(issueId, email);

        issue.setTitle(request.getTitle().trim());
        issue.setDescription(request.getDescription());

        if (request.getType() != null) issue.setType(request.getType());
        if (request.getPriority() != null) issue.setPriority(request.getPriority());
        if (request.getStatus() != null) issue.setStatus(request.getStatus());

        issue.setDueDate(request.getDueDate());

        if (request.getAssigneeId() != null) {
            issue.setAssignee(getUserById(request.getAssigneeId()));
        } else {
            issue.setAssignee(null);
        }

        return toResponse(issueRepository.save(issue));
    }

    @Transactional
    public void deleteIssue(Long issueId, String email) {
        issueRepository.delete(getOwnedIssue(issueId, email));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Assignee not found"));
    }

    private Project getProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Project not found"));
    }

    private void verifyOwnership(Project project, User user) {
        if (!project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You do not own this project");
        }
    }

    private Issue getOwnedIssue(Long issueId, String email) {
        User user = getUser(email);

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Issue not found"));

        verifyOwnership(issue.getProject(), user);
        return issue;
    }

    private IssueResponse toResponse(Issue issue) {
        return new IssueResponse(
                issue.getId(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getType(),
                issue.getPriority(),
                issue.getStatus(),
                issue.getProject().getId(),
                issue.getProject().getName(),
                issue.getReporter().getId(),
                issue.getReporter().getFullName(),
                issue.getAssignee() == null ? null : issue.getAssignee().getId(),
                issue.getAssignee() == null ? null : issue.getAssignee().getFullName(),
                issue.getDueDate(),
                issue.getCreatedAt(),
                issue.getUpdatedAt()
        );
    }
}
