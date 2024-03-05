import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
    // cognito trigger/trigger from update in user_id db
    const user_id = event.request.userAttributes.sub;
    //const username = event.request.userAttributes;
    console.log(user_id);
    // Define the parameters for querying the position_new column
    const queryParams = {
        TableName: 'leaderboard',
        IndexName: 'bucket_id-index', // Assuming an index exists on bucket_id and position_new columns
        KeyConditionExpression: 'bucket_id = :bucket_id',
        ExpressionAttributeValues: {
            ':bucket_id': String(-1)
        },
        ScanIndexForward: false, // Sort in descending order
        Limit: 1 // Limit to 1 result to get the highest position_new
    };

    try {
        // Query the leaderboard table to find the highest position_new
        const queryResult = await dynamoDb.query(queryParams).promise();
        console.log(queryResult);
        // Extract the highest position_new value
        let positionNew = 1; // Default value if no existing entries
        if (queryResult.Count > 0) {
            positionNew = parseInt(queryResult.Items[0].position_new) + 1;
        }

        // Define the parameters for adding a new row
        const putParams = {
            TableName: 'leaderboard',
            Item: {
                'user_id': user_id, // Assuming user_id is the Cognito user ID
                'bucket_id': String(-1),
                // 'position_old': { NULL: true },
                'position_new': positionNew,
                'aggregate_skills_season': 0,
                'endurance_season': 0,
                'strength_season': 0,
                'username': "username"
            },
            ConditionExpression: 'attribute_not_exists(user_id)' // Check if user_id does not already exist
        };

        // Add the new row to the leaderboard table
        await dynamoDb.put(putParams).promise();

        console.log('Successfully added new user to leaderboard');

    } catch (err) {
        console.error('Error adding new user to leaderboard:', err);
    }

    return event;
}