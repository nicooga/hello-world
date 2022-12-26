import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import User from '../User';

import DynamoDbUserRepository from './DynamoDbUserRepository';

@suite
export class DynamoDbUserRepositoryTest {
    @test
    async testPersistAndRetrieveUser() {
        const repo = new DynamoDbUserRepository();

        const email = 'some-email@test.com';
        const name = 'Some Name';
        const hashedPassword = 'somehashedpassword';

        const user = new User(email, name, hashedPassword);

        await repo.persistUser(user);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retrieval: any = await repo.getUserByEmail(email);
        expect(retrieval.ok).to.eq(true);
        expect(retrieval.result).to.be.instanceOf(User);
        expect(retrieval.result).to.include({ email, name, hashedPassword });
    }
}
