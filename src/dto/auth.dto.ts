/**
 * Auth DTOs
 * Data Transfer Objects for Authentication operations
 */

export interface LoginDTO {
    email: string;
    password: string;
}

export interface RegisterDTO {
    email: string;
    password: string;
    fullname: string;
    role?: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

export interface AuthResponseDTO {
    token: string;
    user: {
        id: number;
        email: string;
        fullname: string;
        role: string;
    };
}
