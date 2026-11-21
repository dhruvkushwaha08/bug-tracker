
package com.bugtracker.backend.controller;

import com.bugtracker.backend.entity.User;
import com.bugtracker.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public List<Map<String, Object>> getAllUsers(
            @AuthenticationPrincipal UserDetails currentUser) {

        return userRepository.findAll().stream()
                .filter(User::isEnabled)
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name()
                ))
                .toList();
    }
}
