// src/auth/auth.types.ts
import { Types } from 'mongoose';

export interface JwtPayload {
    sub: Types.ObjectId;
    email: string;
    roles: Types.ObjectId[];
}

export interface AuthResponse {
    message: string;
    user?: UserData,
    access_token?: string;
}

export interface UserResponse {
    _id?: Types.ObjectId;
    email: string;
    isEmailVerified?: boolean;
    isActive?: boolean;
}

export interface ProfileResponse {
    _id?: Types.ObjectId;
    name?: string;
    location?: string;
    contact?: string;
}

export interface UserData {
    user?: UserResponse,
    profile?: ProfileResponse
}

export interface SendGridMailData {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
}