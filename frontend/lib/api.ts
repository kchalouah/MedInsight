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
    role: 'GESTIONNAIRE' | 'RESPONSABLE_SECURITE' | 'MEDECIN' | 'PATIENT'; // Backend enum
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api', // Gateway URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

    // Assign role to user
    assignRole: async (keycloakId: string, role: string) => {
        const response = await api.put<{ message: string }>(`/admin/users/${keycloakId}/roles`, { role });
        return response.data;
    }
};

export default api;
