
/*
 * Copyright (c) 2016, Bigsens, LLC
 * Gateway Server - example implementation on remote side, eg. remote server.
 * Handles all messages from SBC's Service Gateway.
 * Author: Constantin Alexandrov
 */

'use strict';

var util = require('util'),
	EventEmitter = require('events').EventEmitter,
	WebSocketServer = require('ws').Server,
	P = require('./lib/protocol');

var Message = P.Message,
	DeviceState = P.DeviceState,
	DeviceType = P.DeviceType;

function GatewayServer(port) {
	this.port = port;
	this.wss = null;
	this.ws = null;
	this.gateways = {};
}

util.inherits(GatewayServer, EventEmitter);

GatewayServer.prototype.start = function() {
	var self = this;
	var wss = this.wss = new WebSocketServer({ port: this.port });
	wss.on('connection', function(ws) {
		self.ws = ws;
		console.log('New connection'); // But who is?
		ws.on('message', function(message) {
			try {
				var msg = _decodeMessage(message);
				self.readMessage(ws, msg);
			}
			catch(err) {
				console.error('Message handle error', err);
			}
		});
		self.emit('onConnect', ws);
	});
	console.log('Gateway Server listen on port', this.port);

}

GatewayServer.prototype.readMessage = function(ws, msg) {
	var cmd = msg.cmd,
		data = msg.data;
	switch(cmd) {
		case Message.GATEWAY_INFO:
			this.gateways[data.guid] = ws;
			this.emit('gatewayConnect', ws, data);
		break;
		// etc.
	}
}

GatewayServer.prototype.sendMessage = function(ws, msg) {
	ws.send(msg);
}

var _decodeMessage = function(data) {
	return JSON.parse(data);
}

var _encodeMessage = function(data) {
	return JSON.stringify(data);
}

GatewayServer.prototype.getGatewayByGuid = function(guid) {
	// ...
}


/*
 * Main
 */

function main() {
	var gatewayServer = new GatewayServer(8080);

	gatewayServer.on('gatewayConnect', function(ws, gatewayInfo) {

		/*
		Message.GATEWAY_INFO = {
		    "guid": "a567e912-7ac9-471c-83ab-e8e22f992d8a",
		    "hostname": "bigsens",
		    "cpuinfo": { ... }
		    "meminfo": {
		        "totalMem": 1002.16796875,
		        "freeMem": 708.671875,
		        "free": 70.71
		    },
		    "nwkifaces": {
		        "eth0": [
		            {
		                "address": "192.168.0.100",
		                "netmask": "255.255.255.0",
		                "family": "IPv4",
		                "mac": "22:c1:82:c1:60:be",
		                "internal": false
		            },
		            ...
		        ]
		    },
		    ...
		}
		*/

		console.log('Gateway with guid %s connected', gatewayInfo.guid);
		
		// TODO: Add actions with gateway.
		
		
		
	});

	gatewayServer.start();
}

main();
	
