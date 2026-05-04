import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../config/email';
import { passwordResetEmail, welcomeEmail } from '../templates/emails';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, username, password, role } = req.body;

    // fields validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields (name, email, username, password) are required' });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email or username is already taken
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

    // Validate Role (HOST or GUEST only)
    const finalRole = role ?? 'GUEST';
    if (!['HOST', 'GUEST'].includes(finalRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be HOST or GUEST' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPassword,
        role: finalRole,
      },
    });
    const htmlBody=welcomeEmail(name,role)
await sendEmail(
  email,
  "Welcome to Airbnb!",
  htmlBody
)
    // Return user without password
    const { password: _, ...createdUser } = user;
    return res.status(201).json({message:"User registered successfully",createdUser,status:201});

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
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
      token
      // user: userWithoutPassword
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listings: req.role === 'HOST',
        
        bookings: req.role === 'GUEST' ? {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                location: true,
                pricePerNight: true
              }
            }
          }
        } : false
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);

  } catch (error) {
    console.error(error);
    return res.json({ error});
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
//validate
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new passwords are required" });
    }

    // Fetch user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify currentPassword
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    //  Validate newPassword length
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    // Hash and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    //  Find user
    const user = await prisma.user.findUnique({ where: { email } });

    //  Always return 200 to prevent email enumeration
    res.status(200).json({ message: "Reset link has been sent" });

    if (user) {
      //  Generate raw token and hash it
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const restLink=`http://localhost:3000/auth/reset-password/${rawToken}`
const html=passwordResetEmail(user.name,restLink)
      //  Set expiry (1 hour)
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      // Save hashed token to DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: expiry
        }
      });
      await sendEmail(user.email, `Reset Password`,html)

      // (Log it to console for testing) rater will send to email
      console.log(`Reset Link:${restLink}`);
    
    }else{
      console.log("no user")
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const rawToken=token as string;
    const { newPassword } = req.body;

    // Hash the incoming raw token to match the DB
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Find user with valid, non-expired token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    // error message
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long" });
    }

    //  Hash new password and clear tokens
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
      }
    });

    return res.status(200).json({ message: "Password reset successful. You can now log in." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
