// USER CLASS //

const names = [
    "Клинт Иствуд",
    "ДЖОН УЭЙН",
    "ЮЛ БРИННЕР",
    "ГЭРИ КУПЕР",
    "РЭНДОЛЬФ СКОТТ",
    "ДЖЕЙМС СТЮАРТ",
    "БЕРТ ЛАНКАСТЕР",
    "ОДИ МЕРФИ",
    "ГРЕГОРИ ПЕК",
    "ДЖЕЙМС КОБУРН",
    "ЧАРЛЬЗ БРОНСОН",
    "ЛИ ВАН КЛИФ",
    "ФРАНКО НЕРО",
    "КИРК ДУГЛАС",
    "ЛИ МАРВИН",
    "РИЧАРД УИДМАРК",
    "РОБЕРТ МИТЧУМ",
    "ПОЛ НЬЮМАН",
    "ДЖЕЙМС ГАРНЕР"
];

const Player = (id, socket_id) => ({
    position: id,
    socket_id: socket_id,
    name: names[Math.floor(Math.random() * names.length)],
    role: null,
    isAlive: true
});

// GAME CLASS //

const RoleFour = ['Citizen', 'Citizen', 'Citizen', "Mafia"];
const RoleFive = ["Citizen", "Citizen", "Mafia", "Citizen", "Police"];
const RoleSix = ["Citizen", "Citizen", "Mafia", "Mafia", "Medic", "Police"];
const RoleSeven = ["Citizen", "Citizen", "Citizen", "Mafia", "Mafia", "Medic", "Police"];

const times = {
    'day': 1,
    'night': 0
};

const max_players = 7;
const gameSession = (id) => ({
    /** CONFIG **/
    SIGNALING_SERVER: "http://172.16.15.135:10080",
    USE_AUDIO: true,
    USE_VIDEO: true,
    MUTE_AUDIO_BY_DEFAULT: false,
    ICE_SERVERS: [
        {url: "stun:stun.l.google.com:19302"}
    ],
    DEFAULT_CHANNEL: id,

    signaling_socket: null,   /* our socket.io connection to our webserver */
    local_media_stream: null, /* our own microphone / webcam */
    peers: {},               /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
    peer_media_elements: {},


    /** Game setup **/
    id: id,
    players: [],
    presenter: Player(0),
    time: null,
    started: false,

    setDay: () => {
        this.time = times.day
    },

    setNight: () => {
        this.time = times.night
    },

    isSeatAvailable: () => {
        if (this.players) {
            return Object.keys(this.players).length !== max_players
        } else {
            return true
        }
    }
});


// // GAME UTIL //
// class SessionUtil {
//     public sessions = {};
//
//     getSession(id: number) {
//         // @ts-ignore
//         return this.sessions[id]
//     }
//
//     createSession(id: number) {
//         // @ts-ignore
//         this.sessions[id] = new GameSession(id)
//     }
//
//     destroySession(id: number) {
//         // @ts-ignore
//         delete this.sessions[id]
//     }
// }