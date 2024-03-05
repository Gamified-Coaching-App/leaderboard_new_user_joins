import { handler } from '../index.mjs';

// Mock AWS SDK
jest.mock('aws-sdk', () => {
    const mockDocumentClient = {
        query: jest.fn(),
        put: jest.fn(),
        promise: jest.fn(),
    };
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDocumentClient),
        },
    };
});

describe('handler function', () => {
    let event;

    beforeEach(() => {
        event = {
            request: {
                userAttributes: {
                    sub: 'test_user_id',
                },
            },
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should add a new user to the leaderboard', async () => {
        const mockQueryResult = {
            Count: 0,
            Items: [],
        };

        const mockPutResult = {};

        const dynamoDbMock = new AWS.DynamoDB.DocumentClient();
        dynamoDbMock.query.mockReturnValueOnce({ promise: () => Promise.resolve(mockQueryResult) });
        dynamoDbMock.put.mockReturnValueOnce({ promise: () => Promise.resolve(mockPutResult) });

        await handler(event);

        expect(dynamoDbMock.query).toHaveBeenCalledWith(expect.any(Object));
        expect(dynamoDbMock.put).toHaveBeenCalledWith(expect.any(Object));
        expect(console.log).toHaveBeenCalledWith('Successfully added new user to leaderboard');
    });

    it('should handle error when adding new user to the leaderboard', async () => {
        const errorMessage = 'Test error message';
        const error = new Error(errorMessage);

        const dynamoDbMock = new AWS.DynamoDB.DocumentClient();
        dynamoDbMock.query.mockRejectedValueOnce(error);

        await expect(handler(event)).rejects.toThrowError(errorMessage);

        expect(console.error).toHaveBeenCalledWith('Error adding new user to leaderboard:', error);
    });

});
