const {Player, gameSession} = require("./session");

function getNicePosition(usarr) {
    let arr = usarr.sort();

    if (!(arr.length)) {
        return 1
    }

    if (arr[0] !== 1) {
        return 1
    }

    if (arr.length === 1) {
        return 2
    }

    for (let index = 0; index < arr.length; index++) {
        if ((index + 1) === arr.length) {
            return arr.length + 1
        }

        if ((arr[index + 1] - arr[index]) > 1) {
            return arr[index] + 1
        }
    }
    return arr.length + 1
}


const sessionMap = {};


exports.sessionManager = {
    createGame: room_id => {
        sessionMap[room_id] = gameSession(room_id)
    },

    deleteRoom: room_id => {
        delete sessionMap[room_id]
    },

    getGame: room_id => {
        return sessionMap[room_id]
    },

    getPosition: (room_id, socket_id) => {
        if (socket_id === sessionMap[room_id].presenter.socket_id) {
            return 0
        }
        return sessionMap[room_id].players[socket_id].position
    },

    addPlayer: async (room_id, socket_id) => {
        let session = sessionMap[room_id];
        let players_count = Object.keys(session.players).length;
        if (!(session.presenter)) {
            session.presenter = await Player(socket_id, session.names.pop(), 0);
            return
        }

        if (!(players_count)) {
            session.players[socket_id] = await Player(socket_id, session.names.pop(), 1);
        } else {
            // @ts-ignore
            const pos = await getNicePosition([...Array(players_count).keys()].map(i => Object.values(session.players)[i].position));
            session.players[socket_id] = await Player(socket_id, session.names.pop(), pos);

        }


    },

    deletePlayer: (room_id, socket_id) => {
        let session = sessionMap[room_id];
        delete session.players[socket_id];
        return session.players;
    },

    // deletePresenter: (room_id) => {
    //     let session = sessionMap[room_id];
    //     session.presenter = null;
    // },

    setDay: (room_id) => {
        let session = sessionMap[room_id];
        session.time = 'day'
    },

    setNight: room_id => {
        let session = sessionMap[room_id];
        session.time = 'night'
    },

    isFull: room_id => {
        let session = sessionMap[room_id];
        return Object.keys(session.players).length === 8;
    },

    startGame: room_id => {
        let session = sessionMap[room_id];
        switch (Object.keys(session.players).length) {
            case 4:
                Object.keys(session.players).forEach((player, index) => {
                    session.players[player].role = session.RoleFour[index]
                });
                break;

            case 5:
                Object.keys(session.players).forEach((player, index) => {
                    session.players[player].role = session.RoleFive[index]
                });
                break;

            case 6:
                Object.keys(session.players).forEach((player, index) => {
                    session.players[player].role = session.RoleSix[index]
                });
                break;

            case 7:
                Object.keys(session.players).forEach((player, index) => {
                    session.players[player].role = session.RoleSeven[index]
                })

        }
        session.started = true
    },

    endGame: room_id => {
        let session = sessionMap[room_id];
        session.RoleFour = ['Citizen', 'Citizen', 'Citizen', "Mafia"].sort(() => Math.random() - 0.5);
        session.RoleFive = ["Citizen", "Citizen", "Mafia", "Citizen", "Police"].sort(() => Math.random() - 0.5);
        session.RoleSix = ["Citizen", "Citizen", "Mafia", "Mafia", "Medic", "Police"].sort(() => Math.random() - 0.5);
        session.RoleSeven = ["Citizen", "Citizen", "Citizen", "Mafia", "Mafia", "Medic", "Police"].sort(() => Math.random() - 0.5)
        session.started = false
    }


};

