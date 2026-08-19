import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    res.status(401).json({ message: 'Access token missing or invalid' });
    return;
  }

  try {
    const decodedPayload = verifyToken(token);
    req.user = decodedPayload;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};
