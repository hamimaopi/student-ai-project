package com.studentai.project.chat.dto;

import com.studentai.project.message.dto.MessageResponse;
import com.studentai.project.session.dto.SessionParticipantResponse;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSendResponse {
    private MessageResponse reply;
    private SessionParticipantResponse participantState;
}
