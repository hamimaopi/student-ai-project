package com.studentai.project.session;

import com.studentai.project.message.dto.MessageResponse;
import com.studentai.project.session.dto.CreateSessionRequest;
import com.studentai.project.session.dto.SessionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(request));
    }

    @GetMapping
    public ResponseEntity<List<SessionResponse>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> getSessionById(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<SessionResponse> endSession(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.endSession(id));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getSessionMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(sessionService.getSessionMessages(id));
    }

    @GetMapping("/{id}/debrief")
    public ResponseEntity<com.studentai.project.ai.DebriefData> getSessionDebrief(@PathVariable UUID id) {
        com.studentai.project.ai.DebriefData debrief = sessionService.getSessionDebrief(id);
        if (debrief == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(debrief);
    }
}
