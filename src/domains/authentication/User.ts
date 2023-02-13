export default class User {
    public id?: string;

    constructor(
        public readonly email: string,
        public readonly name: string,
        public readonly hashedPassword: string
    ) {
        this.validateEmail(email);
    }

    private validateEmail(email: string): void {
        if (email.trim().length <= 0) throw new InvalidEmailError(this, 'it is an empty string');
        if (!email.match(/.+@.+\..+/)) throw new InvalidEmailError(this, 'it is not a valid email');
    }
}

export class InvalidEmailError extends Error {
    constructor(public readonly user: User, msg: string) {
        super(`Invalid email "${user.email}", ${msg}`);
    }
}
