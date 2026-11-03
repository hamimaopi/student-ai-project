package com.studentai.project.message.dto;

import com.studentai.project.message.SenderType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private UUID id;
    private UUID sessionId;
    private SenderType senderType;
    private UUID studentId;
    private String senderName;
    private String avatarUrl;
    private String content;
    private int turnNumber;
    private Instant createdAt;
}
