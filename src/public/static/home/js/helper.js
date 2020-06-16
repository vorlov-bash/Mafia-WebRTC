$(document).ready(function () {
    $('.create_room').on('click', function () {
        window.location.href = '/createroom'
    });

    $('.join_room').on('click', function () {
        let room_id = prompt('Введите номер комнаты:');
        window.location.href = '/room/' + room_id
    });
})