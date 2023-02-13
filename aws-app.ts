import { App } from 'aws-cdk-lib';

import HelloWorldAwsStack from './aws/HelloWorldAwsStack';

const app = new App();

new HelloWorldAwsStack(app, 'dev');
new HelloWorldAwsStack(app, 'test');

app.synth();