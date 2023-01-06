import path from 'path';

import {
    App,
    Stack,
    aws_dynamodb as dynamo,
    aws_lambda as lambda,
    aws_apigateway as apigateway
} from 'aws-cdk-lib';

import { Construct } from 'constructs';

type Stage = 'dev' | 'test';

class HelloWorldStack extends Stack {
    constructor(scope: Construct, stage: Stage) {
        super(scope, `${stage}-hello-world`);

        new dynamo.Table(this, `${stage}-authentication-users-table`, {
            partitionKey: {
                name: 'email',
                type: dynamo.AttributeType.STRING
            }
        });

        const testFn = new lambda.Function(this, `${stage}-test`, {
            handler: 'AwsLambdaTest.handler',
            code: lambda.Code.fromAsset(path.resolve(__dirname, 'build/infrastructure')),
            runtime: lambda.Runtime.NODEJS_18_X
        });

        const api = new apigateway.LambdaRestApi(this, `${stage}-api`, {
            handler: testFn,
            proxy: false,
        });

        const test = api.root.addResource('test');

        test.addMethod('GET');
    }
}

const app = new App();

new HelloWorldStack(app, 'dev');
new HelloWorldStack(app, 'test');

app.synth();