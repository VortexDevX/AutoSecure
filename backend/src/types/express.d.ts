import { JWTPayload } from '../services/jwtService';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date | undefined;
      };
      files?:
        | {
            [fieldname: string]: Express.Multer.File[];
          }
        | Express.Multer.File[];
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
