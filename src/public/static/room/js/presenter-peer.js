let peers = {};

const mediaPlayer = {
    constraints: {
        'video': true,
        'audio': true
    },
    peer_media_elements: {},
    media_elements_pos: {},
    our_pos: null,
    my_stream: null,

    initLocal: async function () {
        this.my_stream = await navigator.mediaDevices.getUserMedia(this.constraints);

    },

    // initRemote: function (stream, div_num, block_id) {
    //     let video_body = $(`<div class="video_element${div_num} text-center" id=${block_id}>
    //                                 <div class="btn-group btn-group-sm" role="group">
    //                                     <button type="button" class="btn btn-secondary ctrl-btn">Разбудить</button>
    //                                     <button type="button" class="btn btn-secondary ctrl-btn">Усыпить</button>
    //                                     <button type="button" class="btn btn-secondary ctrl-btn">Удалить</button>
    //                                  </div>
    //                                  <video autoplay playsinline muted></video>
    //                             </div>`);
    //
    //     $('.table').append(video_body);
    //     ////
    //     let video_element = $(`.video_element${div_num}#${block_id}`).find('video')[0];
    //
    //     this.peer_media_elements[block_id] = video_element;
    //     video_element.srcObject = stream
    // },

    attachToStream: function (stream, div_num, block_id, buttons, muted) {
        let body = $(`div.c${div_num}`);
        if (buttons) {
            let _this = this;
            let awk_btn = $('<button type="button" class="btn btn-secondary awk-btn">Разбудить</button>').on('click', function () {
                let socket_id = $(this).parent().parent().attr('id');
                // _this.peer_media_elements[socket_id].srcObject.getTracks().forEach(t => t.enabled = true);
                socket.emit('awake', {'socket_id': socket_id})
            });

            let sleep_btn = $('<button type="button" class="btn btn-secondary sleep-btn">Усыпить</button>').on('click', function () {
                let socket_id = $(this).parent().parent().attr('id');
                // console.log($(this));
                // console.log(socket_id);
                // _this.peer_media_elements[socket_id].srcObject.getTracks().forEach(t => t.enabled = false);
                console.log(socket_id);
                socket.emit('sleep', {'socket_id': socket_id})
            });


            let btn_group = $('<div class="btn-group btn-group-sm ctrl-buttons" role="group"></div>').append(awk_btn).append(sleep_btn);
            // body.html(`<div class="btn-group btn-group-sm ctrl-buttons" role="group">
            //           <button type="button" class="btn btn-secondary awk-btn">Разбудить</button>
            //           <button type="button" class="btn btn-secondary sleep-btn">Усыпить</button>
            //           <button type="button" class="btn btn-secondary delete-btn">Удалить</button>
            //        </div>
            //        <video autoplay playsinline muted></video>`);
            ////
            if (muted) {
                body.append(btn_group).append(`<video autoplay playsinline muted></video>`);
            } else {
                body.append(btn_group).append(`<video autoplay playsinline></video>`);

            }
            body.attr('id', block_id);
            let video_element = $(`.video_element#${block_id}`).find('video')[0];
            this.peer_media_elements[block_id] = video_element;
            video_element.srcObject = stream
        } else {
            body.html(`<video autoplay playsinline muted></video>`);
            body.attr('id', block_id);
            let video_element = $(`.video_element#${block_id}`).find('video')[0];
            this.peer_media_elements[block_id] = video_element;
            video_element.srcObject = stream
        }

    },

    attachRole: function (block_id, role) {
        let body = $(`div#${block_id}`);
        body.append(`<p class="role">${role}</p>`)
    }

};


const socket = io('http://localhost:80');
const configuration = {
    'iceServers': [
        {'urls': 'stun:91.192.105.69:3478'},
    ]
};
socket.on('join', async () => {
    console.log('=> [Client] Соединение установлено.', socket);
    await mediaPlayer.initLocal();
    // Join to room
    socket.emit('join_room', {'room_id': ROOM_ID})
    //
});

socket.on('receivePos', data => {
    mediaPlayer.our_pos = data.pos;
    mediaPlayer.attachToStream(mediaPlayer.my_stream, data.pos, socket.id, false, true);
});

socket.on('add_peer', async (config) => {
    let peer_id = config.peer_id;
    const peerConnection = new RTCPeerConnection(configuration);

    peers[peer_id] = peerConnection;
    mediaPlayer.media_elements_pos[peer_id] = config.peer_pos;
    mediaPlayer.our_pos = config.our_pos;

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('relayICE', {
                'peer_id': peer_id,
                'ice': {
                    'sdpMLineIndex': event.candidate.sdpMLineIndex,
                    'candidate': event.candidate.candidate
                }
            })
        }
    };

    peerConnection.onaddstream = event => {
        mediaPlayer.attachToStream(event.stream, mediaPlayer.media_elements_pos[peer_id], peer_id, true, false);
    };


    await peerConnection.addStream(mediaPlayer.my_stream);

    if (config.should_create_offer) {
        const offer = await peerConnection.createOffer();
        console.log('=> [Client] Предложение создано.', offer);
        await peerConnection.setLocalDescription(offer);
        socket.emit('relayOffer', {
            'from': socket.id,
            'to': peer_id,
            'offer': offer
        });
        console.log(`=> [Client] Предложение отправлено к ${peer_id}.`)
    }


});
//
socket.on('receive_answer', async message => {
    if (message.answer) {
        console.log('=> [Client] Ответ получен.', message.answer);
        let peerConn = peers[message.to];
        const remoteDesc = new RTCSessionDescription(message.answer);
        await peerConn.setRemoteDescription(remoteDesc);
        console.log('=> [Client] Описание сессии установлено.', remoteDesc)
    }
});
//
socket.on('answer_to_call', async message => {
    if (message.offer) {
        let peerConn = peers[message.from];
        console.log(`=> [Client] Звонок от ${message.from}`);
        await peerConn.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConn.createAnswer();
        await peerConn.setLocalDescription(answer);
        socket.emit('proxy_answer', {
            'from': message.from,
            'to': message.to,
            'answer': answer,
        });
        console.log(`=> [Client] Звонок принят. Устанавливаю соединение...`)
    }
});

socket.on('iceCandidate', (data) => {
    let peer = peers[data.peer_id];
    let ice_candidate = data.ice;
    peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
});

socket.on('remove_peer', (config) => {
    let peer_id = config.peer_id;
    if (peer_id in mediaPlayer.peer_media_elements) {
        $(`.video_element#${peer_id}`).removeAttr('id').html('')
    }
    if (peer_id in peers) {
        peers[peer_id].close();
    }

    delete peers[peer_id];
    delete mediaPlayer.peer_media_elements[config.peer_id];
    delete mediaPlayer.media_elements_pos[config.peer_id]
});

socket.on('receiveRoles', data => {
    let roles = data.roles;
    for (let [socket_id, role] of Object.entries(roles)) {
        mediaPlayer.attachRole(socket_id, role)
    }
});


