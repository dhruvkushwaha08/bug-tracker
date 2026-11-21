
package com.bugtracker.backend.service;

import com.bugtracker.backend.dto.CommentRequest;
import com.bugtracker.backend.dto.CommentResponse;
import com.bugtracker.backend.entity.Comment;
import com.bugtracker.backend.entity.Issue;
import com.bugtracker.backend.entity.User;
import com.bugtracker.backend.repository.CommentRepository;
import com.bugtracker.backend.repository.IssueRepository;
import com.bugtracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentResponse addComment(
            Long issueId, CommentRequest request, String email) {

        User author = getUser(email);
        Issue issue = getIssue(issueId);
        verifyOwnership(issue, author);

        Comment comment = new Comment();
        comment.setContent(request.getContent().trim());
        comment.setIssue(issue);
        comment.setAuthor(author);

        return toResponse(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long issueId, String email) {

        User user = getUser(email);
        Issue issue = getIssue(issueId);
        verifyOwnership(issue, user);

        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CommentResponse updateComment(
            Long commentId, CommentRequest request, String email) {

        User user = getUser(email);
        Comment comment = getComment(commentId);

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only edit your own comments");
        }

        verifyOwnership(comment.getIssue(), user);
        comment.setContent(request.getContent().trim());

        return toResponse(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {

        User user = getUser(email);
        Comment comment = getComment(commentId);

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You can only delete your own comments");
        }

        verifyOwnership(comment.getIssue(), user);
        commentRepository.delete(comment);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private Issue getIssue(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Issue not found"));
    }

    private Comment getComment(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Comment not found"));
    }

    private void verifyOwnership(Issue issue, User user) {
        if (!issue.getProject().getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You do not own this project");
        }
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getIssue().getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
