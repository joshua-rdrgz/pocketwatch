import { auth } from '@/lib/auth';
import { IncomingMessage } from 'http';

export interface AuthedReq extends IncomingMessage {
  authSession: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
}
