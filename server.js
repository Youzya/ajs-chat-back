const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const WS = require('ws');
const uuid = require('uuid');
const app = new Koa();

const corsOptions = {
  origin: '*',
  credentials: true,
  'Access-Control-Allow-Origin': true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors(corsOptions));

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

const router = new Router();
router.get('/index', async (ctx) => {
  ctx.response.body = 'hello';
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback())
const wsServer = new WS.Server({ server });

const users = [];

wsServer.on('connection', (ws, req) => {
  ws.on('message', msg => {
    const message = JSON.parse(msg);
    if (message.type === 'autorization') {
      const user = users.find((elem) => elem.name === message.name);
      if (!user) {
        const newUser = {
          name: message.name,
          id: uuid.v4(),
        }
        users.push(newUser);
        const answer = JSON.stringify({type: 'autorized', data: users});
        [...wsServer.clients]
        .filter(o => o.readyState === WS.OPEN)
        .forEach(o => o.send(answer));
        return;
      }
      ws.send(JSON.stringify({type: 'error'}));
      return;
    } else if (message.type === 'postMessage') {
      [...wsServer.clients]
        .filter(o => o.readyState === WS.OPEN)
        .forEach(o => o.send(JSON.stringify({ type: 'postMessage', data: message })));
    } else if (message.type === 'deleteUser') {
      let index = users.findIndex((item) => item.name === message.user);
      users.splice(index, 1);
      [...wsServer.clients]
        .filter(o => o.readyState === WS.OPEN)
        .forEach(o => o.send(JSON.stringify({type: 'users', data: users})));
      }
  });
});

server.listen(port);