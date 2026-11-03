package com.studentai.project.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class StudentResponseGenerator {

    private final ChatModel chatModel;

    public String generateResponse(
            String systemPrompt,
            String conversationHistory,
            String teacherLatestMessage,
            String studentName
    ) {
        String userContent = String.format("""
            RECENT CONVERSATION:
            %s

            Teacher: %s

            Respond as %s:
            """,
                conversationHistory,
                teacherLatestMessage.trim(),
                studentName
        );

        Prompt prompt = new Prompt(List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userContent)
        ));

        try {
            String rawReply = chatModel.call(prompt).getResult().getOutput().getText();
            return sanitizeResponse(rawReply, studentName);
        } catch (Exception e) {
            log.error("Failed to generate student response from Ollama: {}", e.getMessage(), e);
            return "Maybe... wait, I'm thinking about what you just said. Could you explain that again?";
        }
    }

    String sanitizeResponse(String text, String studentName) {
        if (text == null || text.isBlank()) {
            return "Maybe... I'm not really sure what to say.";
        }

        String cleaned = text.trim();

        // Strip surrounding quotes if present
        if ((cleaned.startsWith("\"") && cleaned.endsWith("\"")) ||
            (cleaned.startsWith("“") && cleaned.endsWith("”"))) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }

        // Strip prefixes like "Sue: " or "Student: "
        String prefix1 = studentName + ":";
        String prefix2 = "Student:";
        if (cleaned.toLowerCase().startsWith(prefix1.toLowerCase())) {
            cleaned = cleaned.substring(prefix1.length()).trim();
        } else if (cleaned.toLowerCase().startsWith(prefix2.toLowerCase())) {
            cleaned = cleaned.substring(prefix2.length()).trim();
        }

        return cleaned;
    }
}
