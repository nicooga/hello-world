import DynamoDBClient from '@infrastructure/DynamoDBClient';
import Maybe from '@abstract/Maybe';
import Config from '@src/Config';

import { UserRepository } from '../abstract/UserRepository';
import User from '../User';

export default class DynamoDbUserRepository implements UserRepository {
    constructor(
        private readonly tableName: string = Config.dynamoDbTables.authenticationUsers
    ) { }

    async persistUser(user: User): Promise<User> {
        await DynamoDBClient.put({ TableName: this.tableName, Item: user });
        return user;
    }

    async getUserByEmail(email: string): Promise<Maybe<User, Error>> {
        const { Items } = await DynamoDBClient.query({
            TableName: this.tableName,
            KeyConditionExpression: '#email = :email',
            ExpressionAttributeNames: { '#email': 'email' },
            ExpressionAttributeValues: { ':email': email }
        });

        if (Items?.length !== 1)
            return { ok: false, error: new MissingUserError(email) };

        const item = Items[0];

        if (item === undefined)
            return { ok: false, error: new MissingUserError(email) };

        const user = new User(item['email'], item['name'], item['hashedPassword']);

        return { ok: true, result: user };
    }
}

export class MissingUserError extends Error {
    constructor(public readonly email: string) {
        super(`Missing user with email "${email}"`);
    }
}