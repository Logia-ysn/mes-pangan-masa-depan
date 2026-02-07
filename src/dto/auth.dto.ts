/**
 * Auth DTOs
 * Data Transfer Objects for Authentication operations
 */

import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

export interface LoginDTO {
    email: string;
    password: string;
}

export class LoginSchema implements LoginDTO {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}

export interface RegisterDTO {
    email: string;
    password: string;
    fullname: string;
    role?: string;
}

export class RegisterSchema implements RegisterDTO {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsString()
    @IsNotEmpty()
    fullname!: string;

    @IsOptional()
    @IsString()
    role?: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    newPassword: string;
}

export class ChangePasswordSchema implements ChangePasswordDTO {
    @IsString()
    @IsNotEmpty()
    currentPassword!: string;

    @IsString()
    @MinLength(6)
    newPassword!: string;
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
