package com.studentai.project.chat;

import com.studentai.project.chat.dto.ArbitrationResult;
import com.studentai.project.session.SessionParticipant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class ClassroomDiscourseArbiter {

    private static final Map<String, List<String>> NAME_ALIASES = Map.of(
            "marcus", List.of("marcus", "markus", "marcos", "marcuss"),
            "lena", List.of("lena", "leena", "leana", "lina"),
            "sue", List.of("sue", "su", "suzy", "susie")
    );

    // Tier 3: Peer Exclusion Query (e.g. "Does anyone agree with Marcus?", "anyone disagree with sue?", "who agrees with lena?", "Marcus thinks X... does anyone have a different idea?")
    private static final Pattern PEER_EXCLUSION_QUERY = Pattern.compile(
            "(?i)\\b(?:(?:does\\s+)?anyone|anybody|who|someone|anyone\\s+else|everybody\\s+else|rest\\s+of\\s+(?:the\\s+)?class)\\b.*?"
            + "\\b(?:agree|disagree|think\\s+differently|different\\s+(?:explanation|opinion|thought|idea)|another\\s+(?:explanation|opinion|thought|idea))\\b.*?"
            + "\\b(marcus|markus|marcos|marcuss|lena|leena|leana|lina|sue|su|suzy|susie)\\b"
            + "|\\b(marcus|markus|marcos|marcuss|lena|leena|leana|lina|sue|su|suzy|susie)\\b.*?"
            + "\\b(?:does\\s+anyone|anyone\\s+else|who|who\\s+else|anybody|anybody\\s+else|does\\s+anybody)\\b.*?"
            + "\\b(?:agree|disagree|think|have\\s+a\\s+different|have\\s+another)\\b"
    );

    private final Random random;

    public ClassroomDiscourseArbiter() {
        this.random = new Random();
    }

    public ClassroomDiscourseArbiter(Random random) {
        this.random = random;
    }

    public static class StudentMention {
        private final SessionParticipant participant;
        private final int start;
        private final int end;
        private final String matchedText;

        public StudentMention(SessionParticipant participant, int start, int end, String matchedText) {
            this.participant = participant;
            this.start = start;
            this.end = end;
            this.matchedText = matchedText;
        }

        public SessionParticipant getParticipant() { return participant; }
        public int getStart() { return start; }
        public int getEnd() { return end; }
        public String getMatchedText() { return matchedText; }
    }

    public ArbitrationResult arbitrate(
            String teacherMessage,
            UUID explicitTargetStudentId,
            List<SessionParticipant> participants,
            UUID lastSpeakerStudentId
    ) {
        if (participants == null || participants.isEmpty()) {
            throw new IllegalArgumentException("Cannot arbitrate without participants");
        }

        // Tier 1: Explicit UI Selection
        if (explicitTargetStudentId != null) {
            SessionParticipant explicit = findByStudentId(participants, explicitTargetStudentId);
            if (explicit != null) {
                log.info("Turn arbitrated via Tier 1 (MANUAL_TEACHER_SELECTION): {}", explicit.getStudent().getName());
                return ArbitrationResult.builder()
                        .targetParticipant(explicit)
                        .routingReason("MANUAL_TEACHER_SELECTION")
                        .build();
            }
        }

        String normalized = teacherMessage != null ? teacherMessage.replace("’", "'").trim() : "";

        // Tier 3: Peer Exclusion Query ("Does anyone agree with Marcus?", "who agrees with lena")
        Matcher excMatcher = PEER_EXCLUSION_QUERY.matcher(normalized);
        if (excMatcher.find()) {
            String excludedToken = excMatcher.group(1) != null ? excMatcher.group(1) : excMatcher.group(2);
            SessionParticipant excluded = findByStudentNameOrAlias(participants, excludedToken);
            if (excluded != null) {
                String excludedName = excluded.getStudent().getName();
                List<SessionParticipant> eligible = participants.stream()
                        .filter(p -> !p.getStudent().getId().equals(excluded.getStudent().getId()))
                        .toList();
                if (!eligible.isEmpty()) {
                    SessionParticipant chosen = selectWeightedParticipant(eligible, lastSpeakerStudentId);
                    log.info("Turn arbitrated via Tier 3 (PEER_EXCLUSION_QUERY): target={}, excluded={}", chosen.getStudent().getName(), excludedName);
                    return ArbitrationResult.builder()
                            .targetParticipant(chosen)
                            .routingReason("PEER_EXCLUSION_QUERY")
                            .referencedPeerName(excludedName)
                            .referencedParticipant(excluded)
                            .build();
                }
            }
        }

        // Find all student mentions in the text
        List<StudentMention> mentions = findMentions(normalized, participants);
        List<SessionParticipant> distinctParticipants = mentions.stream()
                .map(StudentMention::getParticipant)
                .distinct()
                .toList();

        // Tier 2: Direct Invitation Referencing a Peer
        // If 2 distinct students are mentioned (e.g. "Sue, what do you think about Marcus?", "Sue what about Marcus", "What do you think of Sue, Marcus?")
        if (distinctParticipants.size() == 2) {
            boolean hasInquiryCue = Pattern.compile(
                    "(?i)\\b(?:what\\s+about|how\\s+about|what\\s+(?:do\\s+)?(?:you|u)\\s+think|thoughts?|do\\s+(?:you|u)\\s+agree|agree|disagree|reaction|respond|take|say|think|opinion)\\b|\\?"
            ).matcher(normalized).find();

            if (hasInquiryCue) {
                StudentMention firstMention = mentions.get(0);
                StudentMention lastMention = mentions.get(mentions.size() - 1);

                SessionParticipant target = null;
                SessionParticipant peer = null;

                String textBeforeFirst = normalized.substring(0, firstMention.getStart()).trim();
                String textBetween = normalized.substring(firstMention.getEnd(), lastMention.getStart()).trim();
                String textAfterLast = normalized.substring(lastMention.getEnd()).trim();

                boolean firstIsPeerObject = Pattern.compile("(?i)\\b(?:of|about|with|from|than|on)\\s*$").matcher(textBeforeFirst).find();
                boolean lastIsPeerObject = Pattern.compile("(?i)\\b(?:of|about|with|from|than|on)\\s*$").matcher(textBetween).find();

                if (firstIsPeerObject && !lastIsPeerObject) {
                    // e.g. "what do you think of sue marcus", "do you agree with marcus lena"
                    target = lastMention.getParticipant();
                    peer = firstMention.getParticipant();
                } else if (lastIsPeerObject && !firstIsPeerObject) {
                    // e.g. "sue what about marcus", "marcus do u agree with sue"
                    target = firstMention.getParticipant();
                    peer = lastMention.getParticipant();
                } else {
                    // Check if second mention is vocatively addressed (e.g. "Marcus said basketball. Lena, what do you think?")
                    boolean secondHasInquiry = Pattern.compile("(?i)^(?:\\s*[,:]|\\s+(?:what|how|why|do|thoughts|think))").matcher(textAfterLast).find();
                    boolean isTrailingVocative = Pattern.compile("[,:;?!]\\s*$").matcher(textBetween).find();

                    if (secondHasInquiry || isTrailingVocative) {
                        target = lastMention.getParticipant();
                        peer = firstMention.getParticipant();
                    } else {
                        // Default leading mention as addressed student (e.g. "Sue, Marcus said basketball what do u think")
                        target = firstMention.getParticipant();
                        peer = lastMention.getParticipant();
                    }
                }

                if (target != null && peer != null && !target.equals(peer)) {
                    log.info("Turn arbitrated via Tier 2 (DIRECT_INVITATION_REFERENCING_PEER): target={}, peer={}",
                            target.getStudent().getName(), peer.getStudent().getName());
                    return ArbitrationResult.builder()
                            .targetParticipant(target)
                            .routingReason("DIRECT_INVITATION_REFERENCING_PEER")
                            .referencedPeerName(peer.getStudent().getName())
                            .referencedParticipant(peer)
                            .build();
                }
            }
        }

        // Tier 4: Direct Vocative / Single Student Mention
        // If exactly 1 student is mentioned in any position, route directly to them regardless of commas/punctuation
        if (distinctParticipants.size() == 1) {
            SessionParticipant target = distinctParticipants.get(0);
            log.info("Turn arbitrated via Tier 4 (DIRECT_VOCATIVE_ADDRESS): {}", target.getStudent().getName());
            return ArbitrationResult.builder()
                    .targetParticipant(target)
                    .routingReason("DIRECT_VOCATIVE_ADDRESS")
                    .build();
        }

        // Tier 5: Open-Class Weighted Distribution with Recency Damping
        SessionParticipant chosen = selectWeightedParticipant(participants, lastSpeakerStudentId);
        log.info("Turn arbitrated via Tier 5 (OPEN_CLASS_WEIGHTED_SELECTION): {}", chosen.getStudent().getName());
        return ArbitrationResult.builder()
                .targetParticipant(chosen)
                .routingReason("OPEN_CLASS_WEIGHTED_SELECTION")
                .build();
    }

    private List<StudentMention> findMentions(String text, List<SessionParticipant> participants) {
        List<StudentMention> mentions = new ArrayList<>();
        for (SessionParticipant p : participants) {
            String lower = p.getStudent().getName().toLowerCase();
            List<String> aliases = NAME_ALIASES.getOrDefault(lower, List.of(lower));
            String patternStr = "(?i)\\b(?:" + String.join("|", aliases) + ")\\b";
            Matcher m = Pattern.compile(patternStr).matcher(text);
            while (m.find()) {
                mentions.add(new StudentMention(p, m.start(), m.end(), m.group()));
            }
        }
        mentions.sort(Comparator.comparingInt(StudentMention::getStart));
        return mentions;
    }

    private SessionParticipant findByStudentNameOrAlias(List<SessionParticipant> participants, String token) {
        if (token == null) return null;
        String clean = token.trim().toLowerCase();
        for (SessionParticipant p : participants) {
            String lower = p.getStudent().getName().toLowerCase();
            List<String> aliases = NAME_ALIASES.getOrDefault(lower, List.of(lower));
            if (aliases.contains(clean) || lower.equalsIgnoreCase(clean)) {
                return p;
            }
        }
        return null;
    }

    private SessionParticipant selectWeightedParticipant(List<SessionParticipant> candidates, UUID lastSpeakerId) {
        if (candidates.size() == 1) {
            return candidates.get(0);
        }

        Map<SessionParticipant, Double> weightMap = new LinkedHashMap<>();
        for (SessionParticipant p : candidates) {
            int baseWeight = p.getStudent().getParticipationWeight() != null
                    ? p.getStudent().getParticipationWeight()
                    : 40;
            double effectiveWeight = baseWeight;

            // Recency Damping: If student was the last to speak, reduce weight by 60%
            if (lastSpeakerId != null && p.getStudent().getId().equals(lastSpeakerId)) {
                effectiveWeight *= 0.40;
            }
            weightMap.put(p, effectiveWeight);
        }

        double totalWeight = weightMap.values().stream().mapToDouble(Double::doubleValue).sum();
        double roll = random.nextDouble() * totalWeight;

        double cumulative = 0.0;
        for (Map.Entry<SessionParticipant, Double> entry : weightMap.entrySet()) {
            cumulative += entry.getValue();
            if (roll <= cumulative) {
                return entry.getKey();
            }
        }

        return candidates.get(0);
    }

    private SessionParticipant findByStudentId(List<SessionParticipant> participants, UUID studentId) {
        return participants.stream()
                .filter(p -> p.getStudent().getId().equals(studentId))
                .findFirst()
                .orElse(null);
    }

    private SessionParticipant findByStudentName(List<SessionParticipant> participants, String name) {
        return participants.stream()
                .filter(p -> p.getStudent().getName().equalsIgnoreCase(name.trim()))
                .findFirst()
                .orElse(null);
    }
}
