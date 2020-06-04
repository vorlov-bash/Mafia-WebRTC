$(document).ready(function () {
    $('.start').on('click', () => {
        let players_count = GameSession.players.length;

        if (players_count < 4) {
            alert("Недостаточно игроков.");
            return
        }

        let random_players = GameSession.players.sort(() => Math.random() - 0.5);
        for (let i = 0; i < random_players.length; i++) {
            switch (players_count) {
                case 4:
                    GameSession.players[i].role = RoleFour[i];
                    break;
                case 5:
                    GameSession.players[i].role = RoleFive[i];
                    break;
                case 6:
                    GameSession.players[i].role = RoleSix[i];
                    break;
                case 7:
                    GameSession.players[i].role = RoleFive[i];
                    break;
            }

        }
        GameSession.players.forEach((item, index, array) => {
            GameSession.signaling_socket.emit('transferData', {'player': item, 'channel': GameSession.DEFAULT_CHANNEL})
        });
        GameSession.signaling_socket.emit('cardDealing', {'players_count': players_count})
    });
});