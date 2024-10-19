import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Promotion } from './entities/promotion.entity';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { HashService } from './hash.service';
import { PromotionResolver } from './promotion.resolver';
import { PromotionService } from './promotion.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Verification, Promotion, Restaurant]),
    MailModule,
  ],
  providers: [
    UserResolver,
    UserService,
    PromotionResolver,
    PromotionService,
    HashService,
  ],
  exports: [UserService],
})
export class UserModule {}
