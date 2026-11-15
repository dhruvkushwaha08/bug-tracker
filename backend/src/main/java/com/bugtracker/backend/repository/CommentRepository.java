package com.bugtracker.backend.repository;

import com.bugtracker.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIssueIdOrderByCreatedAtAsc(Long issueId);
    List<Comment> findByAuthorId(Long authorId);
}