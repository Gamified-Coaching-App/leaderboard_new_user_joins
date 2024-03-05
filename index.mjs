import AWS from 'aws-sdk';
import https from 'https'; 

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
    // cognito trigger/trigger from update in user_id db
    const user_id = event.request.userAttributes.sub;
    //const username = event.request.userAttributes;

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

        try {
            await triggerChallengesNewUserGeneration(user_id);
            console.log(`Challenges generation triggered for new user with ID: ${user_id}`);
        } catch (error) {
            console.error("Failed to trigger challenges for new user generation:", error);
        }

    } catch (err) {
        console.error('Error adding new user to leaderboard:', err);
    }

    return event;
}

async function triggerChallengesNewUserGeneration(userId) {
    console.log(`Triggering challenge generation for new user: ${userId}`);

    const challengesApiUrl = 'https://jkipopyatb.execute-api.eu-west-2.amazonaws.com/dev/challenge-creation-new-user';

    // Prepare the payload
    const apiPayload = {
        user_id: userId, 
        season_id: `new_user_season`
    };

    // Convert the payload to a string
    const dataString = JSON.stringify(apiPayload);

    // Define the options for the HTTPS request
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataString),
        },
    };

    // Return a new Promise that resolves or rejects based on the API call outcome
    return new Promise((resolve, reject) => {
        const req = https.request(challengesApiUrl, options, (res) => {
            let response = '';

            res.on('data', (chunk) => {
                response += chunk;
            });

            res.on('end', () => {
                console.log("Response from challenges_new_user_generation:", response);
                resolve(response); // Resolve the promise with the response
            });
        });

        req.on('error', (e) => {
            console.error("Error calling challenges_new_user_generation:", e);
            reject(e); // Reject the promise on error
        });

        // Send the request with the payload
        req.write(dataString);
        req.end();
    });
}