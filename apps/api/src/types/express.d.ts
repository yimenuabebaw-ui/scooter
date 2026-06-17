import "express";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        username: string;
      };
      files?:
        | {
            [fieldname: string]: Express.Multer.File[];
          }
        | Express.Multer.File[];
    }
  }
}

export {};
