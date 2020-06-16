const {sessionManager} = require("../game_utils/session/session_manager");

exports.Routes = {
    isInit: false,

    init: function (router) {
        if (this.isInit) {
            return;
        }

        this.isInit = true;

        router.get('/', async (ctx, next) => {
            await ctx.render('home/index', {'onerror': ctx.query.error})
        });

        router.get('/createRoom', async (ctx) => {
            let room_id = Math.random().toString(36).substr(2, 10);
            await sessionManager.createGame(room_id);
            await ctx.redirect('/room/' + room_id)

        });

        router.get('/room/:room_id', async (ctx) => {
            let room_id = ctx.params.room_id;
            if (sessionManager.getGame(room_id) && !(sessionManager.isFull(room_id))) {
                if (sessionManager.getGame(room_id).presenter) {
                    await ctx.render('room/default', {'room_id': room_id})
                } else {
                    await ctx.render('room/presenter', {'room_id': room_id})
                }
            } else {
                await ctx.redirect('/?error=true',)
            }
        })
    }
};
