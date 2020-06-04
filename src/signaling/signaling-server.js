/**************/
/*** CONFIG ***/
/**************/
const PORT = 10080;


const express = require('express');
const http = require('http');

const main = express();
const server = http.createServer(main);
const io = require('socket.io').listen(server);

server.listen(PORT, null, function () {
    console.log("Listening on port " + PORT);
});

const presenters_sockets = {};
const channels = {};
const sockets = {};
const max_players = 7;
io.sockets.on('connection', function (socket) {
    socket.channels = {};
    sockets[socket.id] = socket;

    console.log("[" + socket.id + "] connection accepted");
    socket.on('disconnect', function () {
        for (let channel in socket.channels) {
            part(channel);
        }
        console.log("[" + socket.id + "] disconnected");
        delete sockets[socket.id];
    });


    socket.on('join', function (config) {
        console.log("[" + socket.id + "] join ", config);
        let channel = config.channel;
        let userdata = config.userdata;

        /** GAME STUFF **/
        if (channels[channel] && Object.keys(channels[channel]).length === 7) {
            socket.emit('raiseFullRoom');
            return
        }

        if (!('presenter' in userdata)) {
            presenters_sockets[channel].emit('addPlayer', {
                'socket_id': socket.id
            })
        }
        /** SOCKET STUFF **/
        if (channel in socket.channels) {
            console.log("[" + socket.id + "] ERROR: already joined ", channel);
            return;
        }

        if (!(channel in channels)) {
            channels[channel] = {};
        }
        if (!('presenter' in userdata)) {
            /** For default players **/
            for (let id in channels[channel]) {
                console.log('///////////////////////////////////////////' + socket.id)
                channels[channel][id].emit('addPeer', {
                    'peer_id': socket.id,
                    'should_create_offer': false,
                    'other_peer': socket.id
                });
                socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true, 'other_peer': id});
            }

            /** For presenter **/
            // presenters_sockets[channel] --> presenter socket
            presenters_sockets[channel].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false, 'other_peer': socket.id});
            socket.emit('addPeer', {'peer_id': presenters_sockets[channel].id, 'should_create_offer': true, 'other_peer': socket.id});

            /** Updating channel **/
            channels[channel][socket.id] = socket;
            socket.channels[channel] = channel;

        } else {
            presenters_sockets[channel] = socket
        }


    });

    function part(channel) {
        console.log("[" + socket.id + "] part ");

        if (!(channel in socket.channels)) {
            console.log("[" + socket.id + "] ERROR: not in ", channel);
            return;
        }

        presenters_sockets[channel].emit('deletePlayer', {
            'socket_id': socket.id
        });


        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
        /** For presenter **/
        // presenters_sockets[channel] --> presenter socket
        presenters_sockets[channel].emit('removePeer', {'peer_id': socket.id});
        socket.emit('removePeer', {'peer_id': presenters_sockets[channel].id});
    }

    socket.on('relayICECandidate', function (config) {
        const peer_id = config.peer_id;
        const ice_candidate = config.ice_candidate;
        console.log("[" + socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    });

    socket.on('relaySessionDescription', function (config) {
        const peer_id = config.peer_id;
        const session_description = config.session_description;
        console.log("[" + socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', {
                'peer_id': socket.id,
                'session_description': session_description
            });
        }
    });

    /** Game stuff **/
    socket.on('cartDealing', function (data) {
        let channel = data.channel;
        for (let id in channels[channel]) {
            channels[channel][id].emit('cartDealing', {'players_count': data.players_count})
        }
        presenters_sockets[channel].emit('cartDealing')
    })

    socket.on('transferData', function (data) {
        channels[data.channel][data.player.socket_id].emit('transferData', {'player': data})
    })
});
