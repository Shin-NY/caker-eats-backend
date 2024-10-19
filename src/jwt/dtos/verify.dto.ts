import * as jwt from 'jsonwebtoken';

export class JwtVerifyInput {
  token: string;
}

export class JwtVerifyOutput {
  ok: boolean;
  result?: string | jwt.JwtPayload;
  error?: string;
}
