declare module 'xss-clean' {
  import { Request, Response, NextFunction } from 'express';

  function xss(options?: any): (req: Request, res: Response, next: NextFunction) => void;
  
  export = xss;
}
