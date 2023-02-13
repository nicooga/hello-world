import Ajv, { JSONSchemaType } from 'ajv';

import AwsLambdaHandler, { LambdaInvocationError } from '@src/infrastructure/AwsLambdaHandler';
import Maybe from '@src/abstract/Maybe';

import DynamoDbUserRepository from '../DynamoDbUserRepository';
import Authentication from '../../Authentication';

type CreateUserParams = {
    email: string;
    name: string;
    password: string;
};

const PARAMS_SCHEMA: JSONSchemaType<CreateUserParams> = {
    type: 'object',
    properties: {
        'email': { 'type': 'string' },
        'name': { 'type': 'string' },
        'password': { 'type': 'string' }
    },
    required: ['email', 'name', 'password']
};

export const createUser = AwsLambdaHandler(
    async (ev, _context, _callback, deps = {
        Authentication,
        UserRepository: DynamoDbUserRepository,
    }) => {
        const repo = new deps.UserRepository();
        const auth = new deps.Authentication(repo);

        const params = parseParams(ev.body);

        if (params.ok) {
            await auth.createUser(params.result);
            return { ok: true, status: 204 };
        } else {
            return { ok: false, status: 400, error: params.error };
        }
    }
);

function parseParams(evBody: string | undefined): Maybe<CreateUserParams, InvalidParamsError> {
    if (evBody === undefined) return { ok: false, error: new InvalidParamsError(undefined) };
    const body = JSON.parse(evBody);
    const ajv = new Ajv;
    const validate = ajv.compile(PARAMS_SCHEMA);
    const valid = validate(body);
    if (!valid) return { ok: false, error: new InvalidParamsError(evBody, validate.errors) };
    return { ok: true, result: body };
}

class InvalidParamsError extends Error implements LambdaInvocationError {
    constructor(
        private readonly evBody: string | undefined,
        // TODO: use a better type here
        private readonly errors?: any
    ) {
        super(`\
Invalid params error:
===
Received:
${JSON.stringify(evBody, null, 2)}
---
Errors:
${JSON.stringify(errors, null, 2)}
===`);
    }

    get payload() {
        return { eventBody: this.evBody, errors: this.errors };
    }
}
