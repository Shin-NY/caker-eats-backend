import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { OrderModule } from './order/order.module';
import { SharedModule } from './shared/shared.module';
import { UploadModule } from './upload/upload.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { HEADER_TOKEN } from './auth/auth.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV == 'production'
          ? '.env'
          : process.env.NODE_ENV == 'development'
          ? '.dev.env'
          : '.test.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test'),
        DATABASE_URL: Joi.string(),
        JWT_KEY: Joi.string(),
        MAILGUN_API_KEY: Joi.string(),
        MAILGUN_DOMAIN: Joi.string(),
        AWS_KEY_ID: Joi.string(),
        AWS_SECRET_KEY: Joi.string(),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      subscriptions: {
        'graphql-ws': true,
      },
      autoSchemaFile: true,
      context: ({ req, connectionParams }) => {
        try {
          let token: string;
          if (req?.headers[HEADER_TOKEN]) token = req.headers[HEADER_TOKEN];
          else if (connectionParams && connectionParams[HEADER_TOKEN])
            token = connectionParams[HEADER_TOKEN];
          return { token };
        } catch (error) {
          console.log(error);
          return;
        }
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get('NODE_ENV') == 'development' ||
          configService.get('NODE_ENV') == 'test',
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_KEY'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    MailModule,
    RestaurantModule,
    OrderModule,
    SharedModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
