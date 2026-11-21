
package com.bugtracker.backend.controller;

import com.bugtracker.backend.dto.ProjectRequest;
import com.bugtracker.backend.dto.ProjectResponse;
import com.bugtracker.backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return projectService.createProject(
                request, userDetails.getUsername());
    }

    @GetMapping
    public List<ProjectResponse> getMyProjects(
            @AuthenticationPrincipal UserDetails userDetails) {

        return projectService.getMyProjects(userDetails.getUsername());
    }

    @GetMapping("/{id}")
    public ProjectResponse getProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        return projectService.getProject(id, userDetails.getUsername());
    }

    @PutMapping("/{id}")
    public ProjectResponse updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        return projectService.updateProject(
                id, request, userDetails.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        projectService.deleteProject(id, userDetails.getUsername());
    }
}
