package com.medinsight.mail.controller;

import com.medinsight.mail.dto.AppointmentReminderRequest;
import com.medinsight.mail.dto.MailRequest;
import com.medinsight.mail.service.MailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mail")
@RequiredArgsConstructor
@Tag(name = "Email Service", description = "Endpoints for sending system notifications and reminders")
public class MailController {

    private final MailService mailService;

    @PostMapping("/send")
    @Operation(summary = "Send a simple email", description = "Can be plain text or HTML")
    public ResponseEntity<String> sendMail(@Valid @RequestBody MailRequest request) {
        mailService.sendSimpleMail(request);
        return ResponseEntity.ok("Email sent successfully");
    }

    @PostMapping("/send-appointment-reminder")
    @Operation(summary = "Send a templated appointment reminder", description = "Uses a predefined HTML template")
    public ResponseEntity<String> sendReminder(@Valid @RequestBody AppointmentReminderRequest request) {
        mailService.sendAppointmentReminder(request);
        return ResponseEntity.ok("Reminder sent successfully");
    }
}
