
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  createUser,
  findUserByEmail,
  findActiveUserById
} from './auth.repository.js';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d'; // 7 days  

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be configured with a strong secret of at least 32 characters.'
  );
}

// Helper functions
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return typeof email === 'string'
    ? email.trim().toLowerCase()
    : '';
}

function validateEmail(email) {
  return (
    email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function formatUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };
}

function createToken(user) {
  return jwt.sign(
    { role: user.role },
    JWT_SECRET,
    {
      subject: user.id,
      expiresIn: TOKEN_EXPIRY,
      algorithm: 'HS256'
    }
  );
}

// Register user
export async function registerUser(data = {}) {
  const fullName =
    typeof data.full_name === 'string'
      ? data.full_name.trim()
      : '';

  const email = normalizeEmail(data.email);
  const password = data.password;

  if (!fullName || !email || typeof password !== 'string') {
    throw createError(
      'Full name, email and password are required.',
      400
    );
  }

  if (fullName.length > 120) {
    throw createError(
      'Full name must not exceed 120 characters.',
      400
    );
  }

  if (!validateEmail(email)) {
    throw createError(
      'Please provide a valid email address.',
      400
    );
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw createError(
      'Password must be at least 8 characters and no more than 72 bytes.',
      400
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );

  try {
    const user = await createUser({
      fullName,
      email,
      passwordHash
    });

    return {
      user: formatUser(user),
      token: createToken(user)
    };
  } catch (error) {
    if (error.code === '23505') {
      throw createError(
        'An account with this email already exists.',
        409
      );
    }

    throw error;
  }
}

// Login user
export async function loginUser(data = {}) {
  const email = normalizeEmail(data.email);
  const password = data.password;

  if (!email || typeof password !== 'string') {
    throw createError(
      'Email and password are required.',
      400
    );
  }

  if (
    !validateEmail(email) ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    throw createError(
      'Invalid email or password.',
      401
    );
  }

  const user = await findUserByEmail(email);

  if (
    !user ||
    !user.is_active ||
    !(await bcrypt.compare(password, user.password_hash))
  ) {
    throw createError(
      'Invalid email or password.',
      401
    );
  }

  return {
    user: formatUser(user),
    token: createToken(user)
  };
}

// Get active user
export async function getActiveUserById(userId) {
  if (typeof userId !== 'string' || !userId) {
    return null;
  }

  return findActiveUserById(userId);
}
