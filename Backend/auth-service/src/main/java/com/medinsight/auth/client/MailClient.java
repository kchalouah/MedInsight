package com.medinsight.auth.client;

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
     * Send a simple email (or HTML).
     */
    public void sendMail(String to, String subject, String body, boolean isHtml) {
        MailRequest request = MailRequest.builder()
                .to(to)
                .subject(subject)
                .body(body)
                .html(isHtml)
                .build();

        webClientBuilder.build()
                .post()
                .uri("http://mail-service:8087/mail/send")
                .body(Mono.just(request), MailRequest.class)
                .retrieve()
                .bodyToMono(Void.class)
                .subscribe(
                        success -> log.debug("Email sent successfully to {}", to),
                        error -> log.error("Failed to send email to {}: {}", to, error.getMessage()));
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
