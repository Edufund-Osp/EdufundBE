import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Helmet helps set HTTP headers to protect against common security threats.
// Links: https://docs.nestjs.com/security/helmet, 
import helmet from 'helmet';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["http://localhost:3000"], // Add other domains to permit communication
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Basic http methods, add/remove if necessary
    credentials: true,
  });

  // Enable helmet usage in application
  app.use(helmet());
  
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
