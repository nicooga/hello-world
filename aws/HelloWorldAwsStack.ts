import path from 'path';

import {
    Stack,
    aws_dynamodb as dynamo,
    aws_lambda as lambda,
    aws_apigateway as apigateway,
    Duration,
    aws_lambda_nodejs
} from 'aws-cdk-lib';

import { Construct } from 'constructs';

type Stage = 'dev' | 'test';

export default class HelloWorldAwsStack extends Stack {
    private readonly tableFactory: DynamoDbTableFactory;

    constructor(scope: Construct, stage: Stage) {
        super(scope, `${stage}-hello-world`);

        this.tableFactory = new DynamoDbTableFactory(this, stage);

        this.tableFactory.createTable('authentication-users', {
            partitionKey: {
                name: 'email',
                type: dynamo.AttributeType.STRING
            }
        });

        const fnFactory = new FunctionFactory(this, stage, this.tableFactory.tableSet);

        const createUser = fnFactory.createFunction(
            'createUser',
            'domains/authentication/infrastructure/AwsLambdaAPI/createUser.ts'
        );

        const api = new LambdaRestAPI(this, 'api', stage);

        api.addIntegration('POST', ['authentication', 'create-user'], createUser);
    }
}

class DynamoDbTableFactory {
    public readonly tableSet = new DynamoDbTableSet();

    constructor(
        private readonly scope: Construct,
        private readonly stage: Stage
    ) { }

    createTable(tableId: string, options: dynamo.TableOptions) {
        const table = new Table(this.scope, this.stage, tableId, options);
        this.tableSet.add(table);
        return table;
    }
}

class Table extends dynamo.Table {
    constructor(
        scope: Construct,
        stage: Stage,
        public readonly name: string,
        options: dynamo.TableProps
    ) {
        const id = `${stage}-${name}`;
        super(scope, id, { ...options, tableName: id });
    }
}

class DynamoDbTableSet {
    private readonly _tables: Table[] = [];
    add(table: Table): void { this._tables.push(table); }
    get tables(): ReadonlyArray<Table> { return this._tables; }
}

class FunctionFactory {
    constructor(
        private readonly scope: Construct,
        private readonly stage: Stage,
        private readonly dynamoDbTableSet: DynamoDbTableSet
    ) { }

    createFunction(handler: string, entry: string): CustomFunction {
        const fn =  new CustomFunction(this.scope, { stage: this.stage, handler, entry });

        this.grantReadWriteOverTables(fn);

        return fn;
    }

    private grantReadWriteOverTables(fn: CustomFunction) {
        if (!fn.role) throw new Error('Function is missing role');
        for (const table of this.dynamoDbTableSet.tables) table.grantReadWriteData(fn.role);
    }
}

interface FunctionProps {
    stage: Stage
    handler: string
    entry: string
}

class CustomFunction extends aws_lambda_nodejs.NodejsFunction {
    constructor(scope: Construct, props: FunctionProps) {
        const id = `${props.stage}-${slugify(props.entry)}-${slugify(props.handler)}`;

        const entry = path.join('src', props.entry);

        super(scope, id, {
            handler: props.handler,
            entry: entry,
            runtime: lambda.Runtime.NODEJS_18_X,
            bundling: { minify: true, sourceMap: true },
            timeout: Duration.minutes(2),
            memorySize: 1024,
            environment: {
                NODE_ENV: props.stage,
                // This only works in NodeJS v12+
                NODE_OPTIONS: '--enable-source-maps'
            }
        });
    }
}

function slugify(s: string): string {
    return s.replaceAll(/\/|\./g, '-');
}

class LambdaRestAPI extends apigateway.LambdaRestApi {
    constructor(scope: Construct, id: string, stage: Stage) {
        const defaultHandler =
            new lambda.Function(
                scope,
                `${stage}-${id}-apigateway-default-handler`,
                {
                    handler: 'handler',
                    code: lambda.Code.fromInline(`
                        module.exports.handler = () => {
                            return { statusCode: 400, body: 'Invalid method or path' };
                        }
                    `),
                    runtime: lambda.Runtime.NODEJS_18_X
                }
            );

        super(scope, `${stage}-${id}`, {
            deployOptions: { stageName: stage },
            proxy: false,
            handler: defaultHandler
        });
    }

    addIntegration(
        method: 'GET' | 'POST',
        path: string[],
        fn: lambda.IFunction
    ) {
        let root = this.root;
        for (const p of path) root = root.addResource(p);
        root.addMethod(method, new apigateway.LambdaIntegration(fn));
    }
}