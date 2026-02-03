import axios from 'axios';

// --- Types ---

export interface UserResponse {
    id: string; // UUID
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    addressLine?: string;
    city?: string;
    country?: string;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
    role: string; // Derived from helper or payload usually, but let's assume we map it or get it
    patientProfile?: PatientProfileResponse;
    medecinProfile?: MedecinProfileResponse;
}

export interface PatientProfileResponse {
    id: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
}

export interface MedecinProfileResponse {
    id: string;
    specialization?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
    consultationFee?: number;
    available?: boolean;
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number; // current page
}

export interface AdminUserCreationRequest {
    email: string;
    password?: string; // Required for creation
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    addressLine?: string;
    city?: string;
    country?: string;
    role: 'ADMIN' | 'GESTIONNAIRE' | 'RESPONSABLE_SECURITE' | 'MEDECIN' | 'PATIENT'; // Backend enum
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api', // Gateway URL
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log("MedInsight V3 - Relative Path Mode Active (BaseURL: " + api.defaults.baseURL + ")");

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API] Sending request to ${config.url} with token: ${token.substring(0, 20)}...`);
    } else {
        console.warn(`[API] Request to ${config.url} WITHOUT token`);
    }
    return config;
});

// --- Admin API Methods ---

// --- Appointment API Methods ---

export interface AppointmentResponse {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentDateTime: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    reason: string;
    notes?: string;
    patientName?: string;
    doctorName?: string;
}

export const appointmentApi = {
    // Get appointments with filters
    getAppointments: async (params?: {
        status?: string,
        patientId?: string,
        doctorId?: string,
        startDate?: string,
        endDate?: string,
        page?: number,
        size?: number
    }) => {
        const response = await api.get<Page<AppointmentResponse>>('/appointments', {
            params: {
                page: 0,
                size: 10,
                ...params
            }
        });
        return response.data;
    },

    // Update appointment status/details
    updateAppointment: async (id: string, data: { status?: string, reason?: string, notes?: string, appointmentDateTime?: string }) => {
        const response = await api.put<AppointmentResponse>(`/appointments/${id}`, data);
        return response.data;
    },

    // Create Prescription
    createPrescription: async (appointmentId: string, data: { patientId: string, medicationName: string, dosage: string, duration: string, instructions: string }) => {
        const response = await api.post(`/appointments/${appointmentId}/prescriptions`, data);
        return response.data;
    },

    // Get Prescriptions for appointment
    getPrescriptions: async (appointmentId: string) => {
        const response = await api.get<any[]>(`/appointments/${appointmentId}/prescriptions`);
        return response.data;
    },

    // Get Patient Prescriptions
    getPatientPrescriptions: async (patientId: string, page: number = 0, size: number = 10) => {
        const response = await api.get<Page<any>>(`/prescriptions/patient/${patientId}`, {
            params: { page, size }
        });
        return response.data;
    },

    // Create a new appointment
    createAppointment: async (data: { patientId: string, doctorId: string, appointmentDateTime: string, reason: string }) => {
        const response = await api.post<AppointmentResponse>('/appointments', data);
        return response.data;
    }
};

export const medecinApi = {
    // List all doctors (paginated)
    getDoctors: async (page: number = 0, size: number = 10) => {
        const response = await api.get<Page<UserResponse>>('/medecins', {
            params: { page, size }
        });
        return response.data;
    },

    // Get doctor's schedule
    getSchedule: async (doctorId: string) => {
        const response = await api.get<any[]>(`/appointments/schedule/${doctorId}`);
        return response.data;
    },

    // Create or update doctor schedule
    updateSchedule: async (data: { doctorId: string, dayOfWeek: string, startTime: string, endTime: string, slotDurationMinutes?: number, isActive?: boolean }) => {
        const response = await api.post('/appointments/schedule', data);
        return response.data;
    },

    // Create default schedule for a doctor
    createDefaultSchedule: async (doctorId: string) => {
        const response = await api.post(`/appointments/schedule/${doctorId}/default`);
        return response.data;
    },

    // Add unavailability period
    addUnavailability: async (params: { doctorId: string, startDateTime: string, endDateTime: string, reason?: string }) => {
        const response = await api.post('/appointments/schedule/unavailability', null, {
            params: params
        });
        return response.data;
    },

    // Get future unavailability periods
    getUnavailability: async (doctorId: string) => {
        const response = await api.get<any[]>(`/appointments/schedule/unavailability/${doctorId}`);
        return response.data;
    },

    // Delete unavailability period
    deleteUnavailability: async (unavailabilityId: string) => {
        const response = await api.delete(`/appointments/schedule/unavailability/${unavailabilityId}`);
        return response.data;
    }
};

export const patientApi = {
    // List all patients (paginated)
    getPatients: async (page: number = 0, size: number = 10) => {
        const response = await api.get<Page<UserResponse>>('/patients', {
            params: { page, size }
        });
        return response.data;
    },

    // Get single patient by Keycloak ID
    getPatient: async (id: string) => {
        const response = await api.get<UserResponse>(`/patients/keycloak/${id}`);
        return response.data;
    }
};

export const medicalRecordApi = {
    // Get Patient Dossier
    getDossier: async (patientId: string) => {
        const response = await api.get<any>(`/records/patient/${patientId}/dossier`);
        return response.data;
    },

    // Add Consultation Note
    addNote: async (data: { appointmentId: string, patientId: string, noteContent: string }) => {
        const response = await api.post('/records/notes', data);
        return response.data;
    },

    // Update Patient Dossier (Clinical Data)
    updateDossier: async (patientId: string, data: { allergies: string, bloodType: string, medicalHistory: string, emergencyContactName?: string, emergencyContactPhone?: string }) => {
        const response = await api.put(`/records/patient/${patientId}`, data);
        return response.data;
    }
};

export const adminApi = {
    // List all users (paginated)
    getUsers: async (page: number = 0, size: number = 10) => {
        const response = await api.get<Page<UserResponse>>('/admin/users', {
            params: { page, size }
        });
        return response.data;
    },

    // Create a new admin/staff user
    createUser: async (userData: AdminUserCreationRequest) => {
        const response = await api.post<UserResponse>('/admin/users', userData);
        return response.data;
    },

    // Assign role to user (can also be used to update status if backend supports it)
    assignRole: async (keycloakId: string, role: string) => {
        const response = await api.put<{ message: string }>(`/admin/users/${keycloakId}/roles`, { role });
        return response.data;
    },

    // Delete user
    deleteUser: async (keycloakId: string) => {
        const response = await api.delete(`/admin/users/${keycloakId}`);
        return response.data;
    },

    // Sync users from Keycloak
    syncKeycloak: async () => {
        const response = await api.post<{ message: string }>('/admin/sync-keycloak');
        return response.data;
    }
};

export interface AuditLog {
    id: string;
    timestamp: string;
    serviceName: string;
    userId: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    resourceId?: string;
    status: string;
    details?: string;
    ipAddress?: string;
}

export const auditApi = {
    // Get all audit logs
    getLogs: async () => {
        const response = await api.get<AuditLog[]>('/audit/logs');
        return response.data;
    },

    // Get logs for a specific user
    getUserLogs: async (userId: string) => {
        const response = await api.get<any[]>(`/audit/logs/user/${userId}`);
        return response.data;
    },

    // Get logs for a specific service
    getServiceLogs: async (serviceName: string) => {
        const response = await api.get<any[]>(`/audit/logs/service/${serviceName}`);
        return response.data;
    },

    // Store an audit log
    storeLog: async (logData: {
        serviceName: string,
        action: string,
        userId: string,
        userEmail?: string,
        userRole?: string,
        status: string,
        details?: string,
        resourceId?: string,
        ipAddress?: string
    }) => {
        const response = await api.post<AuditLog>('/audit/logs', logData);
        return response.data;
    },

    // Seed sample audit logs
    seedLogs: async () => {
        const response = await api.post<string>('/audit/seed');
        return response.data;
    }
};

export const mlApi = {
    // Predict diagnosis based on symptoms
    predictDiagnosis: async (data: { symptoms: string }) => {
        const response = await api.post('/ml/predict/diagnosis', data);
        return response.data;
    },

    // Suggest treatment
    suggestTreatment: async (data: { symptoms: string, diagnosis?: string }) => {
        const response = await api.post('/ml/predict/treatment', {
            symptoms: data.symptoms,
            diagnosis: data.diagnosis
        });
        return response.data;
    }
};

export const mailApi = {
    // Send email
    sendEmail: async (data: { to: string, subject: string, body: string, isHtml?: boolean }) => {
        const response = await api.post('/mail/send', data);
        return response.data;
    }
};

export default api;
