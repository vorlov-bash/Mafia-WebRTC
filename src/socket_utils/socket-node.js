const {sessionManager} = require('../game_utils/session/session_manager');


exports.IO = {
    socket_io: null,
    sockets: {},
    socket_room: {},
    init: function (server) {
        if (this.socket_io) {
            return;
        }

        this.socket_io = require("socket.io")(server);

        this.socket_io.on('connection', socket => {

            console.log(`=> [Server] Новое подключение: ${socket.id}`);
            this.sockets[socket.id] = socket;
            socket.emit('join');

            socket.on('disconnect', () => {
                let room = this.socket_room[socket.id];
                console.log(socket.adapter.rooms[room]);
                if (socket.adapter.rooms[room]) {
                    Object.keys(socket.adapter.rooms[room].sockets).forEach((other_socket) => {
                        this.sockets[other_socket].emit('remove_peer', {'peer_id': socket.id});
                        socket.emit('remove_peer', {'peer_id': other_socket})
                    });
                    socket.leave(room);
                    delete this.sockets[socket.id];
                    delete this.socket_room[socket.id];
                    sessionManager.deletePlayer(room, socket.id);
                } else {
                    delete this.sockets[socket.id];
                    delete this.socket_room[socket.id];
                    sessionManager.deleteRoom(room)
                }
            });
            socket.on('join_room', (data) => {
                sessionManager.addPlayer(data.room_id, socket.id).then(() => {
                    if (socket.adapter.rooms[data.room_id]) {
                        let room_sockets = Object.keys(socket.adapter.rooms[data.room_id].sockets);
                        room_sockets.forEach(socket_id => {
                            this.sockets[socket_id].emit('add_peer', {
                                'peer_id': socket.id,
                                'should_create_offer': false,
                                'peer_pos': sessionManager.getPosition(data.room_id, socket.id),
                            });
                            socket.emit('add_peer', {
                                'peer_id': socket_id,
                                'should_create_offer': true,
                                'peer_pos': sessionManager.getPosition(data.room_id, socket_id),
                            })

                        });
                        socket.join(data.room_id);
                        this.socket_room[socket.id] = data.room_id;
                        socket.emit('receivePos', {'pos': sessionManager.getPosition(data.room_id, socket.id)})
                    }
                    socket.join(data.room_id);
                    this.socket_room[socket.id] = data.room_id;
                    socket.emit('receivePos', {'pos': sessionManager.getPosition(data.room_id, socket.id)})
                });
            });

            socket.on('relayOffer', config => {
                this.sockets[config.to].emit('answer_to_call', {
                    'from': config.from,
                    'to': config.to,
                    'offer': config.offer
                })
            });

            socket.on('relayICE', data => {
                this.sockets[data.peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice': data.ice})
            });

            socket.on('proxy_answer', data => {
                this.sockets[data.from].emit('receive_answer', {
                    'from': data.from,
                    'to': data.to,
                    'answer': data.answer
                })
            });

            /** GAME UTILS **/
            socket.on('startGame', () => {
                let room_id = this.socket_room[socket.id];
                let roomObj = sessionManager.getGame(room_id);
                if (roomObj.started) {
                    return
                }
                let roleBuffer = {};
                sessionManager.startGame(room_id);
                Object.keys(roomObj.players).forEach((other_socket) => {
                    this.sockets[other_socket].emit('receiveRole', {'role': roomObj.players[other_socket].role});
                    roleBuffer[other_socket] = roomObj.players[other_socket].role
                });

                socket.emit('receiveRoles', {'roles': roleBuffer})
            });

            socket.on('endGame', () => {
                let room_id = this.socket_room[socket.id];
                let roomObj = sessionManager.getGame(room_id);
                if (roomObj.started) {
                    Object.keys(roomObj.players).forEach((other_socket) => {
                        this.sockets[other_socket].emit('endGame')
                    });
                    sessionManager.endGame(room_id)
                }
            });

            socket.on('setNight', () => {
                let room_id = this.socket_room[socket.id];
                let roomObj = sessionManager.getGame(room_id);
                if (roomObj.started) {
                    if (roomObj.time === 'day') {
                        Object.keys(roomObj.players).forEach((other_socket) => {
                            this.sockets[other_socket].emit('setNight');
                        });
                        sessionManager.setNight(room_id)
                    }
                }

            });

            socket.on('setDay', () => {
                let room_id = this.socket_room[socket.id];
                let roomObj = sessionManager.getGame(room_id);
                if (roomObj.started) {
                    if (roomObj.time === 'night') {
                        Object.keys(roomObj.players).forEach((other_socket) => {
                            this.sockets[other_socket].emit('setDay');
                        });
                        sessionManager.setDay(room_id)

                    }
                }
            });

            socket.on('awake', data => {
                this.sockets[data.socket_id].emit('setDay', {'presenter': socket.id})
            });

            socket.on('sleep', data => {
                this.sockets[data.socket_id].emit('setNight', {'presenter': socket.id})
            });


        });
        console.log('=> [Server] Сокет инициализирован');
    }
};