package com.studentai.project.chat.dto;

import com.studentai.project.session.SessionParticipant;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ArbitrationResult {
    SessionParticipant targetParticipant;
    String routingReason;
    String referencedPeerName;
    SessionParticipant referencedParticipant;
}
