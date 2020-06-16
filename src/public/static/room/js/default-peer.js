$(document).ready(function () {
    $('.exit').on('click', () => {
        window.location.href = '/';
    });
});

let peers = {};
let role = null;
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

    attachToStream: function (stream, div_num, block_id, muted) {
        let body = $(`div.c${div_num}`);
        if (muted) {
            body.html(`<video autoplay playsinline muted></video>`);
        } else {
            body.html(`<video autoplay playsinline></video>`);

        }
        ////
        body.attr('id', block_id);
        let video_element = $(`.video_element#${block_id}`).find('video')[0];
        this.peer_media_elements[block_id] = video_element;
        video_element.srcObject = stream
    },

    attachRole: function (role) {
        let body = $(`div.c${this.our_pos}`);
        body.append(`<p class="role">${role}</p>`)
    },

    detachRole: function () {
        $(`div.c${this.our_pos}`).find('.role').html('')
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
    mediaPlayer.attachToStream(mediaPlayer.my_stream, data.pos, socket.id, true);
});

socket.on('add_peer', async (config) => {
    let peer_id = config.peer_id;
    const peerConnection = new RTCPeerConnection(configuration);

    peers[peer_id] = peerConnection;
    mediaPlayer.media_elements_pos[peer_id] = config.peer_pos;

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
        mediaPlayer.attachToStream(event.stream, mediaPlayer.media_elements_pos[peer_id], peer_id, false);
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

socket.on('receiveRole', data => {
    role = data.role;
    mediaPlayer.attachRole(data.role)
});

socket.on('endGame', () => {
    mediaPlayer.detachRole()
});

socket.on('setNight', () => {
    Object.values(mediaPlayer.peer_media_elements).forEach((video => {
        video.srcObject.getTracks().forEach(t => t.enabled = false)
    }))
});

socket.on('setDay', () => {
    Object.values(mediaPlayer.peer_media_elements).forEach((video => {
        video.srcObject.getTracks().forEach(t => t.enabled = true)
    }))
});

socket.on('awake', data => {
    mediaPlayer.peer_media_elements[data.presenter].srcObject.getTracks().forEach(t => t.enabled = true)
});

socket.on('sleep', data => {
    mediaPlayer.peer_media_elements[data.presenter].srcObject.getTracks().forEach(t => t.enabled = false)
});

