
package com.bugtracker.backend.service;

import com.bugtracker.backend.dto.ProjectRequest;
import com.bugtracker.backend.dto.ProjectResponse;
import com.bugtracker.backend.entity.Project;
import com.bugtracker.backend.entity.User;
import com.bugtracker.backend.repository.ProjectRepository;
import com.bugtracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, String email) {

        if (projectRepository.existsByProjectKey(
                request.getProjectKey().trim().toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Project key already exists");
        }

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Project project = new Project();
        project.setName(request.getName().trim());
        project.setProjectKey(request.getProjectKey().trim().toUpperCase());
        project.setDescription(request.getDescription());
        project.setOwner(owner);

        return toResponse(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        return projectRepository.findByOwnerId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long id, String email) {
        return toResponse(getOwnedProject(id, email));
    }

    @Transactional
    public ProjectResponse updateProject(
            Long id, ProjectRequest request, String email) {

        Project project = getOwnedProject(id, email);
        String newKey = request.getProjectKey().trim().toUpperCase();

        if (!project.getProjectKey().equals(newKey)
                && projectRepository.existsByProjectKey(newKey)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Project key already exists");
        }

        project.setName(request.getName().trim());
        project.setProjectKey(newKey);
        project.setDescription(request.getDescription());

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id, String email) {
        Project project = getOwnedProject(id, email);
        projectRepository.delete(project);
    }

    private Project getOwnedProject(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Project not found"));

        if (!project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You do not own this project");
        }

        return project;
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getProjectKey(),
                project.getDescription(),
                project.getStatus(),
                project.getOwner().getFullName(),
                project.getCreatedAt()
        );
    }
}
