package com.medinsight.mail.service;

import com.medinsight.mail.dto.AppointmentReminderRequest;
import com.medinsight.mail.dto.MailRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public void sendSimpleMail(MailRequest request) {
        log.info("Sending simple email to: {}", request.getTo());
        try {
            if (request.isHtml()) {
                sendHtmlEmail(request.getTo(), request.getSubject(), request.getBody());
            } else {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(request.getTo());
                message.setSubject(request.getSubject());
                message.setText(request.getBody());
                mailSender.send(message);
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", request.getTo(), e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    public void sendAppointmentReminder(AppointmentReminderRequest request) {
        log.info("Sending appointment reminder to: {}", request.getTo());
        
        Context context = new Context();
        context.setVariable("patientName", request.getPatientName());
        context.setVariable("appointmentDate", request.getAppointmentDate());
        context.setVariable("appointmentTime", request.getAppointmentTime());
        context.setVariable("doctorName", request.getDoctorName());
        context.setVariable("location", request.getLocation());

        String process = templateEngine.process("appointment-reminder", context);
        
        try {
            sendHtmlEmail(request.getTo(), "Rappel de rendez-vous - MedInsight", process);
        } catch (MessagingException e) {
            log.error("Failed to send appointment reminder: {}", e.getMessage());
            throw new RuntimeException("Reminder sending failed", e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String body) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(body, true);
        
        mailSender.send(message);
    }
}
