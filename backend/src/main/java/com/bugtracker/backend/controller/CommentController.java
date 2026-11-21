
package com.bugtracker.backend.controller;

import com.bugtracker.backend.dto.CommentRequest;
import com.bugtracker.backend.dto.CommentResponse;
import com.bugtracker.backend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/issues/{issueId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(
            @PathVariable Long issueId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails user) {

        return commentService.addComment(
                issueId, request, user.getUsername());
    }

    @GetMapping("/issues/{issueId}/comments")
    public List<CommentResponse> getComments(
            @PathVariable Long issueId,
            @AuthenticationPrincipal UserDetails user) {

        return commentService.getComments(issueId, user.getUsername());
    }

    @PutMapping("/comments/{commentId}")
    public CommentResponse updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails user) {

        return commentService.updateComment(
                commentId, request, user.getUsername());
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails user) {

        commentService.deleteComment(commentId, user.getUsername());
    }
}
