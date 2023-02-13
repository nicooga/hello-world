import crypto from 'crypto';
import { PasswordHasher } from '../abstract/PasswordHasher';

export default class CryptoPasswordHasher implements PasswordHasher {
    hash(s: string): string {
        return crypto.createHash('sha256').update(s).digest().toString();
    }
}
