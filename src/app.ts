import express from "express"

import * as homeController from "./controllers/home"
import * as roomController from "./controllers/room"
import * as path from "path";


const app = express();
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
console.log(path.join(__dirname, '..', 'node_modules'));

app.use('/room/static/', express.static(path.join(__dirname, "public", "room")));
app.use('/room/scripts/', express.static(path.join(__dirname, '..', 'node_modules')));
app.use('/static/', express.static(path.join(__dirname, "public", "room")));
app.use('/scripts/', express.static(path.join(__dirname, '..', 'node_modules')));

/**
 * Primary app routes.
 */

app.get('/', homeController.index);
app.get('/createroom', homeController.createroom);
app.get('/room/:roomID', roomController.index);

export default app