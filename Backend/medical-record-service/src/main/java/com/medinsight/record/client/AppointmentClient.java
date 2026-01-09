package com.medinsight.record.client;

import com.medinsight.record.dto.ExternalAppointmentResponse;
import com.medinsight.record.dto.ExternalPrescriptionResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "appointment-service")
public interface AppointmentClient {

    @GetMapping("/api/appointments/patient/{patientId}")
    List<ExternalAppointmentResponse> getPatientAppointments(@PathVariable("patientId") UUID patientId);

    @GetMapping("/api/prescriptions/patient/{patientId}")
    List<ExternalPrescriptionResponse> getPatientPrescriptions(@PathVariable("patientId") UUID patientId);
}
