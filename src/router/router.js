const KoaRouter = require('koa-router');
const {Routes} = require('./routes');

exports.Router = {
    router: null,
    init: function (app) {
        if (this.router) {
            return;
        }

        this.router = new KoaRouter();

        Routes.init(this.router);

        app.use(this.router.routes());

        console.log('=> [Server] Роутер инициализирован');
    }
};