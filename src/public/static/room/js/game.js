$(document).ready(function () {
    $('.start').on('click', () => {
        let players_count = Object.keys(peers).length;
        if (players_count > 3) {
            socket.emit('startGame')
        } else {
            alert('Недостаточно игроков.')
        }
    });

    $('.stop').on('click', () => {
        socket.emit('setDay');
        socket.emit('endGame');
        Object.keys(peers).forEach((peer) => {
            $(`.video_element#${peer}`).find('.role').html('')
        })
    });

    $('.set-night').on('click', () => {
        socket.emit('setNight');
        // Object.values(mediaPlayer.peer_media_elements).forEach((video => {
        //     video.srcObject.getTracks().forEach(t => t.enabled = false)
        // }))
    });

    $('.set-day').on('click', () => {
        socket.emit('setDay');
        // Object.values(mediaPlayer.peer_media_elements).forEach((video => {
        //     video.srcObject.getTracks().forEach(t => t.enabled = true)
        // }))
    });


    $('.exit').on('click', () => {
        window.location.href = '/'
    })
});