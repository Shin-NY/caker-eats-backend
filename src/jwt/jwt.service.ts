import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtVerifyInput, JwtVerifyOutput } from './dtos/verify.dto';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}
  sign(payload: any): string {
    return jwt.sign(payload, this.configService.get('JWT_KEY'));
  }

  verify({ token }: JwtVerifyInput): JwtVerifyOutput {
    try {
      return {
        ok: true,
        result: jwt.verify(token, this.configService.get('JWT_KEY')),
      };
    } catch (e) {
      console.log(e);
      return { ok: false, error: 'jwt verify failed' };
    }
  }
}
