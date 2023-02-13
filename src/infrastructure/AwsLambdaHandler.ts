import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

/** NOTE: Update this as more status codes are needed */
type LambdaInvocationResult =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | { ok: true, status: SuccessCode; result?: any; }
    | { ok: false, status: ErrorCode; error: LambdaInvocationError; }

export interface LambdaInvocationError {
    message: string;
    /** Any value that can be stringified into a valid JSON object */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any;
}

type SuccessCode = 200 | 204;
type ErrorCode = 500 | 400;

type Handler = (...args: Parameters<APIGatewayProxyHandlerV2>) => Promise<LambdaInvocationResult>

/* Higher-order function that encapsulates common behavior for all AWS Lambda handlers, at least the ones used as integrations for APIGateway. */
export default function AwsLambdaHandler(handler: Handler): APIGatewayProxyHandlerV2 {
    return async (ev, context, callback) => {
        try {
            const result = await handler(ev, context, callback);
            const statusCode = result.status;

            if (result.ok) return { statusCode, body: JSON.stringify(result.result) };
            else {
                return {
                    statusCode: result.status,
                    body: JSON.stringify({
                        message: result.error.message,
                        payload: result.error.payload
                    })
                };
            }
        } catch (error) {
            console.error(error);

            if (error instanceof Error) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        error: error.message,
                        stacktrace: error.stack
                    })
                };
            } else {
                return { statusode: 500, error };
            }
        }
    };
}
