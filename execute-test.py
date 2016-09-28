import subprocess
import statistics
import math
import shutil
import requests
import json
import random
import time

# Number of samples used
NO_OF_SAMPLES = 5
NEO4J_HOME = "/home/gobinath/neo4j"
headers = {'content-type': 'application/json'}
users = []


def current_milli_time():
    return int(round(time.time() * 1000))


def byteify(input):
    if isinstance(input, dict):
        return {byteify(key): byteify(value)
                for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [byteify(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input


def get(url):
    r = requests.get(url, auth=('neo4j', 'admin'))
    # print(r.status_code)
    # print(r.json())


def post(url, payload):
    r = requests.post(url, data=json.dumps(payload), headers=headers, auth=('neo4j', 'admin'))
    # print(r.status_code)
    # print(r.json())


# Find a person
def simpleRead():
    user = users[random.randint(0, len(users) - 1)]
    get("http://localhost:7474/contra/person/find/" + user['userID'])


# Find environments
def mediumRead():
    user = users[random.randint(0, len(users) - 1)]
    payload = {
        "endTime": {
            "day": 1,
            "hour": 1,
            "minute": 1,
            "month": 1,
            "second": 0,
            "year": 2015
        },
        "startTime": {
            "day": 1,
            "hour": 1,
            "minute": 1,
            "month": 1,
            "second": 0,
            "year": 2000
        }
    }
    post("http://localhost:7474/contra/environment/find/" + user['userID'], payload)


# Find near by friends
def complexRead():
    user = users[random.randint(0, len(users) - 1)]
    payload = {
        "userID": user['userID'],
        "latitude": 7.46318,
        "longitude": 79.47696,
        "distance": 1000.0,
        "interval": {
            "endTime": {
                "day": 1,
                "hour": 1,
                "minute": 1,
                "month": 1,
                "second": 0,
                "year": 2015
            },
            "startTime": {
                "day": 1,
                "hour": 1,
                "minute": 1,
                "month": 1,
                "second": 0,
                "year": 2000
            }
        }
    }
    post("http://localhost:7474/contra/person/nearby", payload)


# Execute a given process and calculate the average and standard deviation
def execute(function):
    elapsedTimes = []
    for i in range(NO_OF_SAMPLES):
        startTime = current_milli_time()
        function()
        endTime = current_milli_time()
        time = endTime - startTime
        elapsedTimes.append(float(time))

    average = statistics.mean(elapsedTimes)
    standardDeviation = statistics.stdev(elapsedTimes)
    samples = math.ceil(math.pow(((100 * 1.96 * standardDeviation) / (5 * average)), 2))

    return [average, standardDeviation, samples]


def resetNeo4j():
    print("Resetting the database")
    command = [NEO4J_HOME + '/bin/neo4j', 'stop']
    subprocess.Popen(command, stdout=subprocess.PIPE).communicate()[0]

    command = ['rm', '-rf', NEO4J_HOME + '/data/graph.db']
    subprocess.Popen(command, stdout=subprocess.PIPE).communicate()[0]

    command = [NEO4J_HOME + '/bin/neo4j', 'start']
    subprocess.Popen(command, stdout=subprocess.PIPE).communicate()[0]


def generateData(count):
    print("Generate the dummy data")
    known = count / 10
    command = ['node', 'generate-data.js', str(count), str(known)]
    output = subprocess.Popen(command, stdout=subprocess.PIPE).communicate()[0]
    with open("output.txt", "a") as output_file:
        output_file.write(output)
        output_file.write("\n\n")


def test():
    print("Testing read requests")
    with open("output.txt", "a") as output_file:
        result = execute(simpleRead)
        output_file.write("Simple read\n")
        output_file.write('Average: ' + str(result[0]) + " millis\n")
        output_file.write('Std.Dev: ' + str(result[1]) + "\n")
        output_file.write('Samples: ' + str(result[2]) + "( Used samples: " + str(NO_OF_SAMPLES) + " )\n\n\n")

        result = execute(mediumRead)
        output_file.write("Medium read\n")
        output_file.write('Average: ' + str(result[0]) + " millis\n")
        output_file.write('Std.Dev: ' + str(result[1]) + "\n")
        output_file.write('Samples: ' + str(result[2]) + "( Used samples: " + str(NO_OF_SAMPLES) + " )\n\n\n")

        result = execute(complexRead)
        output_file.write("Complex read\n")
        output_file.write('Average: ' + str(result[0]) + " millis\n")
        output_file.write('Std.Dev: ' + str(result[1]) + "\n")
        output_file.write('Samples: ' + str(result[2]) + "( Used samples: " + str(NO_OF_SAMPLES) + " )\n\n\n")


def readUsers():
    global users
    with open('users.txt') as data_file:
        users = json.load(data_file)
        for i in range(len(users)):
            users[i] = byteify(users[i])


print("Start...")
for i in range(100,501,100):
    print("------------------ " + str(i) + " ------------------")
    with open("output.txt", "a") as output_file:
        output_file.write("------------------ " + str(i) + " ------------------\n")
    resetNeo4j()
    generateData(i)
    readUsers()
    test()

print("Finished")
