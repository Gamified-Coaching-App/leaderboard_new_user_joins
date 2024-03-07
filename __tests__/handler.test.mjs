import { handler } from '../index.mjs'; // Assuming the file is named 'handler.js'
import AWS from 'aws-sdk';
import { triggerChallengesNewUserGeneration } from '../utils.mjs';

// Resetting modules to ensure a clean mock state
beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
});

// Mock utils library
jest.mock('../utils.mjs', () => ({
    triggerChallengesNewUserGeneration: jest.fn()
}));

// Mock AWS library
jest.mock('aws-sdk', () => {
    const queryMock = jest.fn();
    const putMock = jest.fn();

    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => ({
                query: jest.fn((params) => ({ promise: () => queryMock(params) })),
                put: jest.fn((params) => ({ promise: () => putMock(params) }))
            })),
        },
        queryMock,
        putMock
    };
});

describe('handler function tests', () => {
    // Mock event object
    const mockEvent = {
        request: {
            userAttributes: {
                sub: 'testUserId',
                preferred_username: 'testUsername'
            }
        }
    };

    it('should add new user to leaderboard successfully', async () => {
        // Mock DynamoDB query response (empty result)
        AWS.queryMock.mockResolvedValueOnce({ Count: 0 });

        // Mock DynamoDB put response
        AWS.putMock.mockResolvedValueOnce({});

        triggerChallengesNewUserGeneration.mockResolvedValueOnce();

        // Call the handler function
        await handler(mockEvent);

        // Assert that DynamoDB query method is called with correct params
        expect(AWS.queryMock).toHaveBeenCalledTimes(1);
        expect(AWS.queryMock).toHaveBeenCalledWith({
            TableName: 'leaderboard',
            IndexName: 'bucket_id-index',
            KeyConditionExpression: 'bucket_id = :bucket_id',
            ExpressionAttributeValues: { ':bucket_id': '-1' },
            ScanIndexForward: false,
            Limit: 1
        });

        // Assert that DynamoDB put method is called with correct params
        expect(AWS.putMock).toHaveBeenCalledTimes(1);
        expect(AWS.putMock).toHaveBeenCalledWith({
            TableName: 'leaderboard',
            Item: {
                'user_id': 'testUserId',
                'bucket_id': '-1',
                'position_new': 1,
                'aggregate_skills_season': 0,
                'endurance_season': 0,
                'strength_season': 0,
                'username': 'testUsername'
            },
            ConditionExpression: 'attribute_not_exists(user_id)'
        });
        
        // Assert that no challenges are created
        expect(triggerChallengesNewUserGeneration).toHaveBeenCalledTimes(1);
    });

});
