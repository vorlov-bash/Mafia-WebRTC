import express from "express"

import * as homeController from "./controllers/home"
import * as roomController from "./controllers/room"
import * as path from "path";

const app = express();

app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(
    express.static(path.join(__dirname, "public"), {maxAge: 31557600000})
);

/**
 * Primary app routes.
 */

app.get('/', homeController.index);
app.get('/room/:token', roomController.index);

export default app