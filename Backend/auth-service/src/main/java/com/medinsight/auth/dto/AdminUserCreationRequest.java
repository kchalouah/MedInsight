package com.medinsight.auth.dto;

import com.medinsight.auth.entity.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin user creation (GESTIONNAIRE, RESPONSABLE_SECURITE).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserCreationRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phoneNumber;
    private String addressLine;
    private String city;
    private String country;

    @NotNull(message = "Role is required")
    private RoleEnum role;
}
