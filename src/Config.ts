export default new class Config {
    public readonly env = getEnv('NODE_ENV');
    public readonly awsRegion = getEnv('AWS_REGION');
    public readonly dynamoDbTables = {
        authenticationUsers: `${this.env}-authentication-users`
    };
};

function getEnv(varName: string): string {
    const value = process.env[varName];
  
    if (typeof value !== 'string')
        throw new Error(`Missing environment variable "${varName}"`);
  
    return value;
}
