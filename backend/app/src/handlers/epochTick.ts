import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'epoch tick',
      }),
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'epoch tick error',
      }),
    }
  }
}
