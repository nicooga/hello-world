import { suite, test } from '@testdeck/mocha';

import expect from '@test/expect';
import Maybe from '@abstract/Maybe';

import { UserRepository } from './abstract/UserRepository';
import User, { InvalidEmailError } from './User';
import Authentication, { InvalidPasswordError, MissingUserError } from './Authentication';
import CryptoPasswordHasher from './infrastructure/CryptoPasswordHasher';

const TEST_HASHED_PASSWORD = 'test hash';
const TEST_EMAIL = 'some-email@email.com';
const TEST_NAME = 'Some name';
const TEST_PASSWORD = 'some password';

@suite
export class AuthenticationServiceTest {
    @test
    async testCreateValidUser() {
        const { authentication, repo } = this.setup();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creation: any = await this.createUser(authentication);

        const user = creation.result;

        expect(user.email).to.eq(TEST_EMAIL);
        expect(user.name).to.eq(TEST_NAME);
        expect(user.hashedPassword).to.eq(TEST_HASHED_PASSWORD);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retrievalResult: any = await repo.getUserByEmail(TEST_EMAIL);

        expect(retrievalResult.result).to.be.instanceOf(User);
        expect(retrievalResult.result).to.include({
            email: TEST_EMAIL,
            name: TEST_NAME,
            hashedPassword: TEST_HASHED_PASSWORD
        });
    }

    @test
    async testCreateInvalidUser() {
        const { authentication } = this.setup();

        const email = 'some-email';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creation: any = await this.createUser(authentication, email);

        expect(creation).to.haveOwnProperty('ok', false);
        expect(creation.error).to.be.instanceOf(InvalidEmailError);
        expect(creation.error.message).to.eq('Invalid email "some-email", it is not a valid email');
        expect(creation.error.user).to.be.instanceOf(User);
        expect(creation.error.user).to.include({
            email,
            name: TEST_NAME,
            hashedPassword: TEST_HASHED_PASSWORD
        });
    }

    @test
    async testAuthenticateValidUser() {
        const { authentication } = this.setup();

        const creation = await this.createUser(authentication);

        if (!creation.ok) throw creation.error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authenticationResult: any = await authentication.authenticate(TEST_EMAIL, TEST_PASSWORD);

        expect(authenticationResult.ok).to.eq(true);
        expect(authenticationResult.result).to.be.instanceOf(User);
        expect(authenticationResult.result).to.include({
            email: TEST_EMAIL,
            name: TEST_NAME,
            hashedPassword: TEST_HASHED_PASSWORD
        });
    }

    @test
    async testAuthenticateWithMissingUser() {
        const { authentication } = this.setup();

        const creation = await this.createUser(authentication);

        if (!creation.ok) throw creation.error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authenticationResult: any = await authentication.authenticate('not-the-correct-email@email.com', 'not the password');

        expect(authenticationResult.ok).to.eq(false);
        expect(authenticationResult.error).to.be.instanceOf(MissingUserError);
    }

    @test
    async testAuthenticateWithInvalidPassword() {
        const { authentication, hasher } = this.setup();

        hasher.disableMock();

        const creation = await this.createUser(authentication);

        if (!creation.ok) throw creation.error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authenticationResult: any = await authentication.authenticate(TEST_EMAIL, 'not the password');

        expect(authenticationResult.ok).to.eq(false);
        expect(authenticationResult.error).to.be.instanceOf(InvalidPasswordError);
        expect(authenticationResult.error.user).to.be.instanceOf(User);
        expect(authenticationResult.error.message).to.eq(`Invalid password for user with email "${TEST_EMAIL}"`);
    }

    private async createUser(
        authentication: Authentication,
        email = TEST_EMAIL,
        name = TEST_NAME,
        password = TEST_PASSWORD
    ) : Promise<Maybe<User, InvalidEmailError>> {
        return await authentication.createUser({ email, name, password });
    }

    private setup() {
        const repo = new TestUserRepository();
        const hasher = new TestPasswordHasher();
        const authentication = new Authentication(repo, hasher);
        return { authentication, repo, hasher };
    }
}

class TestUserRepository implements UserRepository {
    private readonly users: Record<string, User> = {};

    async persistUser(user: User): Promise<User> {
        user.id = new Date().getTime().toString();
        this.users[user.email] = user;
        return user;
    }

    async getUserByEmail(email: string): Promise<Maybe<User, Error>> {
        const user = this.users[email];

        if (user === undefined) {
            const error = new Error('Could not find user with email "${email}"');
            return { ok: false, error };
        }

        return { ok: true, result: user };
    }
}

class TestPasswordHasher extends CryptoPasswordHasher {
    private enableMock = true;

    override hash(s: string): string {
        if (this.enableMock) return TEST_HASHED_PASSWORD;
        return super.hash(s);
    }

    disableMock() {
        this.enableMock = false;
    }
}