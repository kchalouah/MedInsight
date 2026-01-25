package com.medinsight.appointment.client;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class MailClient {

    private final WebClient.Builder webClientBuilder;

    /**
     * Send a specialized appointment reminder/notification.
     */
    public void sendAppointmentEmail(AppointmentReminderRequest request) {
        webClientBuilder.build()
                .post()
                .uri("http://mail-service:8087/mail/appointment-reminder")
                .body(Mono.just(request), AppointmentReminderRequest.class)
                .retrieve()
                .bodyToMono(Void.class)
                .subscribe(
                        success -> log.debug("Appointment email sent successfully to {}", request.getTo()),
                        error -> log.error("Failed to send appointment email to {}: {}", request.getTo(),
                                error.getMessage()));
    }

    /**
     * Send a simple email.
     */
    public void sendSimpleMail(String to, String subject, String body) {
        MailRequest request = MailRequest.builder()
                .to(to)
                .subject(subject)
                .body(body)
                .html(false)
                .build();

        webClientBuilder.build()
                .post()
                .uri("http://mail-service:8087/mail/send")
                .body(Mono.just(request), MailRequest.class)
                .retrieve()
                .bodyToMono(Void.class)
                .subscribe(
                        success -> log.debug("Simple email sent successfully to {}", to),
                        error -> log.error("Failed to send simple email to {}: {}", to, error.getMessage()));
    }

    @Data
    @Builder
    public static class AppointmentReminderRequest {
        private String to;
        private String patientName;
        private String appointmentDate;
        private String appointmentTime;
        private String doctorName;
        private String location;
    }

    @Data
    @Builder
    public static class MailRequest {
        private String to;
        private String subject;
        private String body;
        private boolean html;
    }
}
