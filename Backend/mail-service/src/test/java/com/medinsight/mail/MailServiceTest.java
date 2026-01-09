package com.medinsight.mail;

import com.medinsight.mail.dto.MailRequest;
import com.medinsight.mail.service.MailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
public class MailServiceTest {

    @Autowired
    private MailService mailService;

    @MockBean
    private JavaMailSender mailSender;

    @Test
    public void testSendSimpleMail() {
        MailRequest request = MailRequest.builder()
                .to("test@example.com")
                .subject("Test")
                .body("Hello")
                .html(false)
                .build();

        mailService.sendSimpleMail(request);

        verify(mailSender).send(any(SimpleMailMessage.class));
    }
}
