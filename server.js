const http = require('http')
const util = require('util')
const path = require('path')

const Koa = require('koa')
const views = require('koa-views')
const serve = require('koa-static')

const {IO} = require('./src/socket_utils/socket-node')
const {Router} = require('./src/router/router')
const config = require('./config')

const Server = {
    app: null,
    init: async function () {
        // Singletone method
        if (this.app) {
            return;
        }

        this.app = new Koa();
        this.app.use(views(path.join(__dirname, 'views'), {extension: 'ejs'}));
        this.app.use(serve(path.join(__dirname, 'src/public')));
        this.app.use(serve(path.join(__dirname, 'node_modules')));
        Router.init(this.app);


        // Http server
        const httpServer = http.createServer(this.app.callback());
        try {
            // @ts-ignore
            await util.promisify(httpServer.listen).call(httpServer, 80);
            console.log(`=> Сервер инициализирован: http://localhost:80`);
            await IO.init(httpServer)

        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    }
};

Server.init();