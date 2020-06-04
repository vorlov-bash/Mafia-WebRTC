const GameSession = gameSession(parseInt(ROOM_ID));
console.log(`Peers: ${GameSession.peers}`);

console.log("Connecting to signaling server");
GameSession.signaling_socket = io(GameSession.SIGNALING_SERVER);

GameSession.signaling_socket.on('connect', function () {
    console.log("Connected to signaling server");
    setup_local_media(() => {
        join_chat_channel(GameSession.DEFAULT_CHANNEL, {'presenter': true});
    });
});

GameSession.signaling_socket.on('disconnect', function () {
    console.log("Disconnected from signaling server");
    for (let peer_id in GameSession.peer_media_elements) {
        GameSession.peer_media_elements[peer_id].remove();
    }
    for (let peer_id in GameSession.peers) {
        GameSession.peers[peer_id].close();
    }

    GameSession.peers = {};
    GameSession.peer_media_elements = {};
});

function join_chat_channel(channel, userdata) {
    GameSession.signaling_socket.emit('join', {"channel": channel, "userdata": userdata});
}


GameSession.signaling_socket.on('addPeer', function (config) {
    console.log('Signaling server said to add peer:', config);
    let peer_id = config.peer_id;
    if (peer_id in GameSession.peers) {
        console.log("Already connected to peer ", peer_id);
        return;
    }
    let peer_connection = new RTCPeerConnection(
        {"iceServers": GameSession.ICE_SERVERS},
        {"optional": [{"DtlsSrtpKeyAgreement": true}]}
    );
    GameSession.peers[peer_id] = peer_connection;

    peer_connection.onicecandidate = function (event) {
        if (event.candidate) {
            GameSession.signaling_socket.emit('relayICECandidate', {
                'peer_id': peer_id,
                'ice_candidate': {
                    'sdpMLineIndex': event.candidate.sdpMLineIndex,
                    'candidate': event.candidate.candidate
                }
            });
        }
    };
    peer_connection.onaddstream = function (event) {
        console.log("onAddStream", event);
        let remote_media = GameSession.USE_VIDEO ? $(`<video id="${event.stream.id}">`) : $("<audio>");
        remote_media.attr("autoplay", "autoplay");
        if (GameSession.MUTE_AUDIO_BY_DEFAULT) {
            remote_media.attr("muted", "true");
        }
        remote_media.attr("controls", "");
        GameSession.peer_media_elements[peer_id] = remote_media;
        appendSeat(remote_media);
        attachMediaStream(remote_media[0], event.stream);
    };

    peer_connection.addStream(GameSession.local_media_stream);
    if (config.should_create_offer) {
        console.log("Creating RTC offer to ", peer_id);
        peer_connection.createOffer(
            function (local_description) {
                console.log("Local offer description is: ", local_description);
                peer_connection.setLocalDescription(local_description,
                    function () {
                        GameSession.signaling_socket.emit('relaySessionDescription',
                            {'peer_id': peer_id, 'session_description': local_description});
                        console.log("Offer setLocalDescription succeeded");
                    },
                    function () {
                        alert("Offer setLocalDescription failed!");
                    }
                );
            },
            function (error) {
                console.log("Error sending offer: ", error);
            });
    }
});


GameSession.signaling_socket.on('sessionDescription', function (config) {
    console.log('Remote description received: ', config);
    let peer_id = config.peer_id;
    let peer = GameSession.peers[peer_id];
    let remote_description = config.session_description;
    console.log(config.session_description);

    let desc = new RTCSessionDescription(remote_description);
    let stuff = peer.setRemoteDescription(desc,
        function () {
            console.log("setRemoteDescription succeeded");
            if (remote_description.type === "offer") {
                console.log("Creating answer");
                peer.createAnswer(
                    function (local_description) {
                        console.log("Answer description is: ", local_description);
                        peer.setLocalDescription(local_description,
                            function () {
                                GameSession.signaling_socket.emit('relaySessionDescription',
                                    {'peer_id': peer_id, 'session_description': local_description});
                                console.log("Answer setLocalDescription succeeded");
                                console.log(`Finish with [${peer_id}]`);
                                GameSession.players.forEach((player, index) => {
                                    if (player.socket_id === peer_id) {
                                        GameSession.signaling_socket.emit('transferData', {
                                            'player': player,
                                            'channel': GameSession.DEFAULT_CHANNEL
                                        })
                                    }
                                });
                                ~
                                    console.log(`Data transfer to [${peer_id}] complete`)

                            },
                            function () {
                                alert("Answer setLocalDescription failed!");
                            }
                        );
                    },
                    function (error) {
                        console.log("Error creating answer: ", error);
                        console.log(peer);
                    });
            }
        },
        function (error) {
            console.log("setRemoteDescription error: ", error);
        }
    );
    console.log("Description Object: ", desc);

});


GameSession.signaling_socket.on('iceCandidate', function (config) {
    let peer = GameSession.peers[config.peer_id];
    let ice_candidate = config.ice_candidate;
    peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
});


GameSession.signaling_socket.on('removePeer', function (config) {
    console.log('Signaling server said to remove peer:', config);
    let peer_id = config.peer_id;
    if (peer_id in GameSession.peer_media_elements) {
        GameSession.peer_media_elements[peer_id].remove();
    }
    if (peer_id in GameSession.peers) {
        GameSession.peers[peer_id].close();
    }

    delete GameSession.peers[peer_id];
    delete GameSession.peer_media_elements[config.peer_id];
});

/** Game stuff **/
function getNiceI(arr) {
    for (let i in arr) {
        let index = parseInt(i);
        if (index + 1 === arr.length) {
            return index + 1
        }
        if ((arr[index + 1].position - arr[index].position) !== 1) {
            return index + 1;
        }
    }
}


GameSession.signaling_socket.on('addPlayer', function (data) {
    if (GameSession.players.length && GameSession.isSeatAvailable()) {
        let index = getNiceI(GameSession.players);
        let player = Player(GameSession.players[index - 1].position + 1, data.socket_id);
        GameSession.players.splice(index, 0, player);
    } else {
        GameSession.players.push(Player(1, data.socket_id))
    }
});

GameSession.signaling_socket.on('deletePlayer', function (data) {
    GameSession.players.forEach((player, index, array) => {
        if (player.socket_id === data.socket_id) {
            console.log(player)
            array.splice(index, 1)
        }
    })
});

GameSession.signaling_socket.on('raiseFullRoom', function () {
    alert('Error: Комната заполненная.');
    window.location.replace("http://localhost:3000")
});

GameSession.signaling_socket.on('cardDealing', function (data) {

})


function setup_local_media(callback, errorback) {
    if (GameSession.local_media_stream != null) {
        if (callback) callback();
        return;
    }

    console.log("Requesting access to local audio / video inputs");


    navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

    attachMediaStream = function (element, stream) {
        console.log('DEPRECATED, attachMediaStream will soon be removed.');
        element.srcObject = stream;
    };

    appendSeat = function appendSeat(media) {
        const table = $('.table');
        const childrens = table.children();
        const camsCount = childrens.find('video').length;
        $(childrens[camsCount]).css("visibility", "visible");
        $(childrens[camsCount]).append(media);
    };

    navigator.getUserMedia({"audio": GameSession.USE_AUDIO, "video": GameSession.USE_VIDEO},
        function (stream) { /* user accepted access to a/v */
            console.log("Access granted to audio/video");
            GameSession.local_media_stream = stream;
            let local_media = GameSession.USE_VIDEO ? $(`<video id='${GameSession.signaling_socket.peer_id}'>`) : $("<audio>");
            local_media.attr("autoplay", "autoplay");
            local_media.attr('width', "250");
            local_media.attr('height', '150');
            local_media.prop('muted', true);
            local_media.attr("controls", "");

            appendSeat(local_media);
            console.log(local_media[0]);
            attachMediaStream(local_media[0], stream);

            if (callback) callback();
        },
        function () { /* user denied access to a/v */
            console.log("Access denied for audio/video");
            alert("You chose not to provide access to the camera/microphone, demo will not work.");
            if (errorback) errorback();
        });
}