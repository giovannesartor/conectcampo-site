import { Global, Module } from '@nestjs/common';
import { AuthFlowService } from './auth-flow.service';

@Global()
@Module({ providers: [AuthFlowService], exports: [AuthFlowService] })
export class AuthFlowModule {}
