package com.studentai.project.system;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/system")
public class SystemController {
  @GetMapping("/status")
  public Map<String, Object> status() { return Map.of("service", "student-ai-project", "status", "UP", "timestamp", Instant.now().toString()); }
}
