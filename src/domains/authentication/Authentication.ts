import User, { InvalidEmailError } from './User';

import Maybe from '@abstract/Maybe';

import { UserRepository } from './abstract/UserRepository';
import { PasswordHasher } from './abstract/PasswordHasher';

export default class Authentication {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher
    ) { }

    async createUser(p: {
        email: string,
        name: string,
        password: string
    }): Promise<Maybe<User, InvalidEmailError>> {
        const hashedPassword = this.passwordHasher.hash(p.password);  

        try {
            const user = new User(p.email, p.name, hashedPassword);
            const result = await this.userRepository.persistUser(user);

            return { ok: true, result };
        } catch (error) {
            if (error instanceof InvalidEmailError) return { ok: false, error: error };
            throw error;
        }
    }

    async authenticate(email: string, password: string): Promise<
        Maybe<User, MissingUserError | InvalidPasswordError>
    > {
        const retrieval = await this.userRepository.getUserByEmail(email);

        if (!retrieval.ok)
            return { ok: false, error: new MissingUserError(email, retrieval.error) };

        const user = retrieval.result;
        const goodPass = this.isGoodPassword(retrieval.result, password);

        if (!goodPass)
            return { ok: false, error: new InvalidPasswordError(user) };

        return retrieval;
    }

    private isGoodPassword(u: User, password: string): boolean {
        const hashedPassword = this.passwordHasher.hash(password);
        return u.hashedPassword === hashedPassword;
    }
}

export class AuthenticationError extends Error {
    constructor(
        msg: string,
        public readonly originalError: Error | null
    ) {
        super(msg);
    }
}

export class MissingUserError extends AuthenticationError {
    constructor(
        public readonly email: string,
        originalError: Error
    ) {
        super(`Missing user with email "${email}"`, originalError);
    }
}

export class InvalidPasswordError extends AuthenticationError {
    constructor(public readonly user: User) {
        super(`Invalid password for user with email "${user.email}"`, null);
    }
}
