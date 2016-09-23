
/*
 * Copyright (c) 2016, Bigsens, LLC
 * Machine Server - example implementation on remote side, eg. remote server.
 * Manage all machines connected to the server. Handle messages from machines.
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

function fmtJson(json) {
	return JSON.stringify(json, null, 2);
}


/*
 * Example of the machine object
 */

function Machine(ws, info) {

	this.ws = ws;
	this.name = 'Home gateway';

	this.info = info;
	this.guid = info.guid;

	// For machine object identification from socket, as example
	this.ws.guid = this.guid;

	// Example fields
	this.services = {};
	this.devices = {};

}

Machine.prototype.getGuid = function() {
	return this.guid;
}

// Send message to the current machine
Machine.prototype.sendMessage = function(msg) {
	this.ws.send(msg);
}

/*
 * Example of the machine server
 */

function MachineServer(port) {
	this.port = port;
	this.wss = null;

	this.machinesPool = {}; // key : machine uuid, value : machine object
}

util.inherits(MachineServer, EventEmitter);


MachineServer.prototype.getMachineByGuid = function(guid) {
	return this.machinesPool[guid];
}

MachineServer.prototype.start = function() {
	var self = this;
	var wss = this.wss = new WebSocketServer({ port: this.port });

	wss.on('connection', function(ws) {

		console.log('New connection'); // But who is? 

		// Wait for identification messages
		ws.on('message', function(message) {
			try {
				
				console.log('PACKET = %j', message);
				
				var msg = _decodeMessage(message);
				self.readMessage(ws, msg);
			}
			catch(err) {
				console.error('Message handle error', err);
			}
		});

	});
	console.log('Machine server listen on port', this.port);

}

MachineServer.prototype.readMessage = function(ws, msg) {
	var cmd = msg.cmd,
		data = msg.data;
	
	console.log(cmd + ' = ' + data);

	switch(cmd) {

		case Message.MACHINE_INFO:
			// Create the machine object
			var machine = new Machine(ws, data);

			this.machinesPool[machine.getGuid()] = machine;

			this.emit('machineInfo', ws, data);
		break;

		case Message.SERVICE_ANNCE:
			/*var machineGuid = ws.guid;
			if(machineGuid && this.machinesPool[machineGuid]) {
				var serviceGuid = data.guid;
				this.machinesPool[machineGuid].services[serviceGuid] = data;
			}*/

			this.emit('serviceAnnounce', ws, data);
		break;

		case Message.DEVICE_LIST:
			this.emit('deviceList', ws, data);
		break;
		
		case Message.DEVICE_STATE:
			this.emit('deviceState', ws, data);
		break;

		// This message will not be seen by server look at socket onerror.
		//case Message.MACHINE_DISCONNECT:
		//break;

		// etc.
	}
}

MachineServer.prototype.sendMessage = function(ws, msg) {
	ws.send(msg);
}

var _decodeMessage = function(data) {
	return JSON.parse(data);
}

var _encodeMessage = function(data) {
	return JSON.stringify(data);
}

function fmtJson(json) {
	return JSON.stringify(json, null, 2);
}

/*
 * Main
 */

function main() {

	// Create machine server on port 8080
	var machineServer = new MachineServer(8080);

	//

	machineServer.on('machineInfo', function(ws, machineInfo) {

		/*
		Message.MACHINE_INFO = {
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

		console.log('Machine with guid %s connected', machineInfo.guid);

		// TODO: Add actions with machine.

		// Get machine
		var machine = machineServer.getMachineByGuid('a567e912-7ac9-471c-83ab-e8e22f992d8a');

		setInterval(function() {

			// Get device list from machine, response will be in the same message - DEVICE_LIST
			//machine.sendMessage(_encodeMessage({ cmd : Message.DEVICE_LIST }));

		}, 5000);

	});

	// Response from DEVICE_LIST
	machineServer.on('deviceList', function(ws, deviceList) {
		console.log('Device list %s for machine %s', fmtJson(deviceList), ws.guid);
	});
	
	// Event for DEVICE_STATE
	machineServer.on('deviceState', function(ws, deviceState) {
		console.log('Device state %s for machine %s', fmtJson(deviceState), ws.guid);
	});

	// Data from SERVICE_ANNCE
	machineServer.on('serviceAnnounce', function(ws, serviceInfo) {
		console.log('Service %s announce for machine %s', serviceInfo.name, ws.guid);
	});

	// Run machine server
	machineServer.start();

}

main();


