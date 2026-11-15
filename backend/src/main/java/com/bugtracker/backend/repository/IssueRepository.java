package com.bugtracker.backend.repository;

import com.bugtracker.backend.entity.Issue;
import com.bugtracker.backend.entity.IssueStatus;
import com.bugtracker.backend.entity.IssuePriority;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    List<Issue> findByProjectId(Long projectId);

    List<Issue> findByAssigneeId(Long assigneeId);

    List<Issue> findByReporterId(Long reporterId);

    List<Issue> findByProjectIdAndStatus(
            Long projectId, IssueStatus status);

    List<Issue> findByProjectIdAndPriority(
            Long projectId, IssuePriority priority);
}