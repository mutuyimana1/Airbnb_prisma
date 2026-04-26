import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, username, password, role } = req.body;

    // 1. Validate all fields are present
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields (name, email, username, password) are required' });
    }

    // 2. Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // 3. Check if email or username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    // 4. Validate Role (HOST or GUEST only)
    const finalRole = role ?? 'GUEST';
    if (!['HOST', 'GUEST'].includes(finalRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be HOST or GUEST' });
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
        role: finalRole,
      },
    });

    // 7. Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input presence
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // 3. Verify user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 5. Return success with token and user info (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
