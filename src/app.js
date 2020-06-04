"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var homeController = __importStar(require("./controllers/home"));
var roomController = __importStar(require("./controllers/room"));
var path = __importStar(require("path"));
var app = express_1.default();
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(express_1.default.static(path.join(__dirname, "public")));
console.log(path.join(__dirname, '..', 'node_modules'));
app.use('/room/static/', express_1.default.static(path.join(__dirname, "public", "room")));
app.use('/room/scripts/', express_1.default.static(path.join(__dirname, '..', 'node_modules')));
app.use('/static/', express_1.default.static(path.join(__dirname, "public", "room")));
app.use('/scripts/', express_1.default.static(path.join(__dirname, '..', 'node_modules')));
/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/createroom', homeController.createroom);
app.get('/room/:roomID', roomController.index);
exports.default = app;
