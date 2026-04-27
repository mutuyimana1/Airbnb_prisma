import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: number;
    role?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    } catch (ex) {
        return res.status(400).json({ error: 'Invalid token.' });
    }
};

export const requireHost = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.role !== 'HOST') {
        return res.status(403).json({ error: 'Host access required.' });
    }
    next();
};
export const requireGuest=(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(req.role!=='GUEST' && req.role!=='ADMIN'){
        return res.status(403).json({error:'Access denied. GUEST role required.'});
    }
    next()
}