import AWS from 'aws-sdk';
import { DocumentClient as DCTypes } from 'aws-sdk/lib/dynamodb/document_client';

import Config from '@src/Config';

/** A little wrapper around DocumentClient to promisify its return values */
export default new class DynamoDbClient {
    private readonly client = new AWS.DynamoDB.DocumentClient({ region: Config.awsRegion });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async put(input: DCTypes.PutItemInput): Promise<DCTypes.PutItemOutput> {
        return new Promise((res, rej) => {
            this.client.put(
                input,
                (err, data) => err ? rej(err) : res(data)
            );
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async query(input: DCTypes.QueryInput): Promise<DCTypes.QueryOutput> {
        return new Promise((res, rej) => {
            this.client.query(
                input,
                (err, data) => err ? rej(err) : res(data)
            );
        });
    }
};
