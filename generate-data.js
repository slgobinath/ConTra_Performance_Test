/*
 * node generate.js <no_of_persons> <no_of_knows_relations>
 */
var fs = require('fs');
var dummyjson = require('dummy-json');
var request = require('sync-request');
var _ = require('underscore');

var no_of_persons = parseInt(process.argv[2]);
var no_of_locations_per_user = 10;
var no_of_environments_per_user = 10;
var no_of_knows_relations = parseInt(process.argv[3]);
var users = []
var timeForUser = 0.0;
var timeForLocation = 0.0;

var neo4jCypherURL = 'http://neo4j:admin@localhost:7474/db/data/cypher';
var createUserURL = 'http://neo4j:admin@localhost:7474/contra/person/create';
var updateUserURL = 'http://neo4j:admin@localhost:7474/contra/person/update';
var createLocationURL = 'http://neo4j:admin@localhost:7474/contra/location/create';
var createEnvironmentURL = 'http://neo4j:admin@localhost:7474/contra/environment/create';
var createKnowsURL = 'http://neo4j:admin@localhost:7474/contra/person/knows';

/*********************************************************************************************/
/*                                      HELPER FOR dummy-json                                */
/*********************************************************************************************/
var myHelpers = {
    mac: function() {
        var hexDigits = "0123456789ABCDEF";
        var macAddress = "";
        for (var i = 0; i < 6; i++) {
            macAddress += hexDigits.charAt(Math.round(Math.random() * 16));
            macAddress += hexDigits.charAt(Math.round(Math.random() * 16));
            if (i != 5) macAddress += ":";
        }

        return macAddress;
    },

    deviceID: function() {
        var hexDigits = "0123456789ABCDEF";
        var id = "";
        for (var i = 0; i < 16; i++) {
            id += hexDigits.charAt(Math.round(Math.random() * 16));
        }

        return id.toLowerCase();
    },

    manufacturer: function() {
        return dummyjson.utils.randomArrayItem(['Acer', 'Alcatel', 'Allview', 'Amazon', 'Amoi', 'Apple', 'Archos', 'Asus', 'Benefon', 'BenQ', 'BenQSiemens', 'BenQ', 'Bird', 'BlackBerry', 'BLU', 'Bosch', 'BQ', 'Casio', 'Cat', 'Celkon', 'Chea', 'Coolpad', 'Dell', 'Emporia', 'Energizer', 'Ericsson', 'Eten', 'Fujitsu', 'GarminAsus', 'Garmin', 'Gigabyte', 'Gionee', 'Google', 'Haier', 'HP', 'HTC', 'Huawei', 'imate', 'imobile', 'Icemobile', 'Innostream', 'Intex', 'Jolla', 'Karbonn', 'Kyocera', 'Lava', 'Lenovo', 'LG', 'Maxon', 'Maxwest', 'Meizu', 'Micromax', 'Microsoft', 'Mitac', 'Mitsubishi', 'Modu', 'Motorola', 'MWg', 'NEC', 'Neonode', 'NIU', 'Nokia', 'Nvidia', 'O2', 'OnePlus', 'Oppo', 'Orange', 'Palm', 'Panasonic', 'Pantech', 'Parla', 'Philips', 'Plum', 'Posh', 'Prestigio', 'QMobile', 'Qtek', 'Sagem', 'Samsung', 'Sendo', 'Sewon', 'Sharp', 'Siemens', 'Sonim', 'Sony', 'Spice', 'TMobile', 'Telit', 'Thuraya', 'Toshiba', 'Unnecto', 'Vertu', 'Vodafone', 'Wiko', 'WND', 'XCute', 'Xiaomi', 'XOLO', 'Yezz', 'Yota', 'YU', 'ZTE']);
    },

    sensor: function() {
        return dummyjson.utils.randomArrayItem(['Accelerometer', ' Magnetic', ' Gyroscope', ' Proximity', ' Pressure', ' Orientation', ' Rotation', ' Linear Acceleration', ' Gravity', ' Magnetic', ' Gyroscope', ' Game Rotation', ' Geomagnetic', ' Significant', ' HTC Gesture']);
    }
};
/*********************************************************************************************/


/*********************************************************************************************/
/*                                       WRITE TO TEXT FILE                                  */
/*********************************************************************************************/
var writeToFile = function(fileName, obj) {
    fs.writeFile(fileName, obj, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file is saved!");
    });
};
/*********************************************************************************************/

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/*********************************************************************************************/
/*                                 LOADING ALL THE JSON TEMPLATES                            */
/*********************************************************************************************/
// Load the templates
var templateCreateUser = fs.readFileSync('template/create_user.hbs', {
    encoding: 'utf8'
});

var templateUpdateUser = fs.readFileSync('template/update_user.hbs', {
    encoding: 'utf8'
});

var templateCreateLocation = fs.readFileSync('template/create_location.hbs', {
    encoding: 'utf8'
});

var templateCreateEnvironment = fs.readFileSync('template/create_environment.hbs', {
    encoding: 'utf8'
});
/*********************************************************************************************/



/*********************************************************************************************/
/*                                          CREATE A USER                                    */
/*********************************************************************************************/
var createUser = function() {
        // Create a new user
        var result = dummyjson.parse(templateCreateUser, {
            helpers: myHelpers
        });

        var obj = JSON.parse(result);

        // Extract the userID and deviceID
        userID = obj.userID
        deviceID = obj.device.deviceID;

        var startTime = new Date().getTime();
        request('POST', createUserURL, {
            json: obj
        });
        var endTime = new Date().getTime();

        timeForUser += (endTime - startTime);


        // Update the user
        result = dummyjson.parse(templateUpdateUser, {
            helpers: myHelpers
        });

        obj = JSON.parse(result);
        obj.userID = userID;

        request('POST', updateUserURL, {
            json: obj
        });

        return {
            userID: userID,
            deviceID: deviceID
        };
    }
    /*********************************************************************************************/


/*********************************************************************************************/
/*                                       UPDATE THE USER                                     */
/*********************************************************************************************/
var updateUser = function(user) {
        // Create a new user
        var result = dummyjson.parse(templateUpdateUser, {
            helpers: myHelpers
        });

        var obj = JSON.parse(result);
        obj.userID = user.userID;

        request('POST', updateUserURL, {
            json: obj
        });
    }
    /*********************************************************************************************/


/*********************************************************************************************/
/*                                       CREATE LOCATIONS                                    */
/*********************************************************************************************/
var createLocation = function(user) {
        // Create a new user
        var result = dummyjson.parse(templateCreateLocation, {
            helpers: myHelpers
        });

        var obj = JSON.parse(result);
        // Update the properties
        obj.userID = user.userID;
        obj.deviceID = user.deviceID;
        obj.location.locationID = String(obj.location.latitude) + ":" + String(obj.location.longitude);

        var startTime = new Date().getTime();
        request('POST', createLocationURL, {
            json: obj
        });
        var endTime = new Date().getTime();

        timeForLocation += (endTime - startTime);
    }
    /*********************************************************************************************/


/*********************************************************************************************/
/*                                      CREATE ENVIRONMENT                                   */
/*********************************************************************************************/
var createEnvironment = function(user) {
        // Create a new user
        var result = dummyjson.parse(templateCreateEnvironment, {
            helpers: myHelpers
        });

        var obj = JSON.parse(result);
        // Update the properties
        obj.userID = user.userID;
        obj.deviceID = user.deviceID;

        request('POST', createEnvironmentURL, {
            json: obj
        });
    }
    /*********************************************************************************************/


/*********************************************************************************************/
/*                                         CREATE KNOWS                                      */
/*********************************************************************************************/
var createKnows = function(user, friend) {
        url = createKnowsURL + "?person=" + user.userID + "&friend=" + friend.userID;
        request('POST', url, {});
    }
    /*********************************************************************************************/

/*********************************************************************************************/
/*                            CREATE DUMMY DATA AND SEND TO THE NEO4J                        */
/*********************************************************************************************/
for (var i = 0; i < no_of_persons; i++) {
    user = createUser();
    
    updateUser(user);

    for (var j = 0; j < no_of_locations_per_user; j++) {
        createLocation(user);
    }

    for (var j = 0; j < no_of_environments_per_user; j++) {
        createEnvironment(user);
    }

    users.push(user)
};


if (no_of_persons > 1 && no_of_persons >= no_of_knows_relations) {
    for (var i = 0; i < no_of_knows_relations; i++) {
        index1 = getRandomInt(0, users.length);
        index2 = index1;
        while(index1 == index2) {
            index2 = getRandomInt(0, users.length);
        }
        createKnows(users[index1], users[index2]);
    }
}

writeToFile("users.txt", JSON.stringify(users));
/*********************************************************************************************/


timeForUser = timeForUser / no_of_persons;
timeForLocation = timeForLocation / (no_of_persons * no_of_locations_per_user);

// Print the summary
var nodeCountResult = request('POST', neo4jCypherURL, {
    json: {
        query: 'START n=node(*) RETURN count(n)'
    }
});

var relationshipCountResult = request('POST', neo4jCypherURL, {
    json: {
        query: 'START r=relationship(*) RETURN count(r)'
    }
});

console.log("Number of nodes: " + JSON.parse(nodeCountResult.getBody()).data[0][0]);
console.log("Number of relationships: " + JSON.parse(relationshipCountResult.getBody()).data[0][0]);
console.log("Average time to create a user: " + timeForUser + " millis");
console.log("Average time to create a location: " + timeForLocation + " millis");