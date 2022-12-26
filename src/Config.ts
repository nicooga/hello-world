export default {
    env: getEnv('NODE_ENV') ?? 'dev',
    awsRegion: getEnv('AWS_REGION'),
};

function getEnv(varName: string): string {
    const value = process.env[varName];
  
    if (typeof value !== 'string')
        throw new Error(`Missing environment variable "${varName}"`);
  
    return value;
}
