import { Injectable } from '@nestjs/common';
import { HASH_ROUNDS } from './user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  async hash(data: string) {
    return await bcrypt.hash(data, HASH_ROUNDS);
  }

  compare(data: string, hash: string) {
    return bcrypt.compare(data, hash);
  }
}
