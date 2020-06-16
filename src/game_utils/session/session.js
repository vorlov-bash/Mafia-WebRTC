"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
exports.Player = exports.gameSession = void 0;
exports.gameSession = function (room_id) {
    return ({
        names: [
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
        ].sort(function () {
            return Math.random() - 0.5;
        }),
        RoleFour: ['Citizen', 'Citizen', 'Citizen', "Mafia"].sort(function () {
            return Math.random() - 0.5;
        }),
        RoleFive: ["Citizen", "Citizen", "Mafia", "Citizen", "Police"].sort(function () {
            return Math.random() - 0.5;
        }),
        RoleSix: ["Citizen", "Citizen", "Mafia", "Mafia", "Medic", "Police"].sort(function () {
            return Math.random() - 0.5;
        }),
        RoleSeven: ["Citizen", "Citizen", "Citizen", "Mafia", "Mafia", "Medic", "Police"].sort(function () {
            return Math.random() - 0.5;
        }),
        room: room_id,
        players: {},
        presenter: null,
        time: 'day',
        started: false,
    });
};
exports.Player = function (socket_id, name, position) {
    return ({
        socket_id: socket_id,
        position: position,
        name: name,
        role: null,
        isAlive: true
    });
};
