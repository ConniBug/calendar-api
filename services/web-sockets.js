const l = require("@connibug/js-logging");
const WebSocketServer = require('websocket').server;
const https = require('https');

const heartbeat_interval = 30000; // 30 seconds

const isTokenValid = require("../api/proxys/authProxy.js").isTokenValid;

const fs = require('fs');
const server = https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),

}, function(request, response) {
    l.log(' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(400, function() {
    l.log('Websocket HTTPS Server is listening on port 400');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    let allowedOrigins = [
        "https://cal.transgirl.space", "http://cal.transgirl.space",
        "https://100.110.174.208:30000", "http://100.110.174.208:30000",
        "https://localhost:30000", "http://localhost:30000",
        "https://localhost", "http://localhost",
    ];
    return allowedOrigins.includes(origin);
}

wsServer.on('request', function(request) {
    request.path = request.resourceURL.pathname;
    console.log(request.origin);

    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        l.verbose(' Connection from origin ' + request.origin + ' rejected.', "websocket");
        return;
    }

    let connection = request.accept('echo-protocol', request.origin);
    l.verbose(' Connection accepted - ' + request.origin + ' - ' + request.remoteAddress, "websocket");

    connection.user = null;
    connection.isAlive = true;

    connection.sendUTF(JSON.stringify({
        type: 'options',
        options: {
            timeout: heartbeat_interval,
        }
    }));

    connection.on('message', function(message_raw) {
        let message;
        if (message_raw.type === 'utf8') {
            message = JSON.parse(message_raw.utf8Data);
        }
        else if (message_raw.type === 'binary') {
            message = JSON.parse(message_raw.binaryData);
        }
        else {
            l.warning('Unknown message type: ' + message_raw.type);
            connection.close();
            return;
        }
        handle_message(connection, message);
    });

    connection.on('close', function(reasonCode, description) {
        l.debug(' Peer ' + connection.remoteAddress + ' disconnected.', "websocket");

        // Remove the heartbeat interval
        clearInterval(heatbeat);
    });

    connection.on('error', function(error) {
        l.log(' Peer ' + connection.remoteAddress + ' errored.');
    });

    connection.on('ping', function(data) {
        l.log(' Peer ' + connection.remoteAddress + ' pinged.');
    });
    connection.on('pong', function(data) {
        this.isAlive = true;
    });

    // Heartbeat to ensure the connection is still alive
    const heatbeat = setInterval(function ping() {
        connection
        if (connection.isAlive === false) {
            l.verbose(' Peer ' + connection.remoteAddress + ' is dead.', "heartbeat");
            return connection.close();
        }
        l.verbose(' Peer ' + connection.remoteAddress + ' is alive.', "heartbeat");

        connection.isAlive = false;
        connection.ping();
        connection.sendUTF(JSON.stringify({type: 'heartbeat'}));

    }, heartbeat_interval);

});

function send(connection, message) {
    // l.verbose('Sending Message: ' + JSON.stringify(message));
    setTimeout(() => {
        connection.sendUTF(JSON.stringify(message));
        clearInterval(this);
    }, 1000);
}
function handle_message(connection, message) {
    if(!connection.user && message.type !== 'auth') {
        l.debug('User not authenticated', "websocket");
        send(connection,{ type: "auth", status: "failed" });
        connection.close();
        return;
    }
    // l.log('Received Message: ' + JSON.stringify(message));

    switch(message.type) {
        case 'auth':
            if(!isTokenValid(message.id, message.token)) {
                send(connection,{ type: "auth", status: "failed" });
                connection.close();
                return;
            }
            send(connection, { type: "auth", status: "success" });
            connection.user = message.id;

            l.debug(`User ${message.id} authenticated.`, "websocket");
            module.exports.isUserConnected(message.id);
            break;
        case 'create':
            break;
        case 'update':
            break;
        case 'delete':
            break;
        default:
            l.log('Unknown message type: ' + message.type);
    }
}

module.exports.isUserConnected = function(memberID) {
    let user_connections = [];
    for(let i = 0; i < wsServer.connections.length; i++) {
        if(wsServer.connections[i].user === memberID) {
            user_connections.push(wsServer.connections[i]);
        }
    }
    if(user_connections.length > 0) {
        l.debug(`User ${memberID} is connected on ${user_connections.length} sessions`, "websocket");
        return user_connections;
    }
    return false;
}

/**
 * Sends a message to a user
 * @param memberID
 * @param message
 */
module.exports.send_message = function(memberID, message) {
    let connections = module.exports.isUserConnected(memberID);
    if(!connections) {
        l.debug('User not connected', "websocket");
        return;
    }
    connections.forEach(function(connection) {
        send(connection, message);
    });
}