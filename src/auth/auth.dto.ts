// auth.dto.ts
import { IsEmail, IsString, IsOptional, IsArray, MinLength, IsNotEmpty, Length, IsPhoneNumber, ValidateIf, Matches } from 'class-validator';
import { Types } from 'mongoose';

export class RegisterDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roles?: string[];

    @IsOptional()
    @IsString()
    occupation?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((o) => o.contact !== undefined) // Validate only if contact is provided
    @Matches(/^\+\d{10,15}$/, {
        message: 'Contact must be in the format +xxxxxxxxxx (e.g., +2348123456789)',
    })
    @IsPhoneNumber()
    contact?: string;
}

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    otp: string;
}

export class ResendVerificationDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @IsString()
    @IsNotEmpty()
    newPassword: string;
}

// auth.types.ts
export interface JwtPayload {
    sub: Types.ObjectId;
    email: string;
    roles: Types.ObjectId[];
}

export interface AuthResponse {
    message: string;
    user?: UserResponse;
    access_token?: string;
}

export interface UserResponse {
    _id?: Types.ObjectId;
    name?: string;
    email: string;
    isEmailVerified?: boolean;
    isActive?: boolean;
}

export interface ChangePasswordResponse {
    message: string;
}