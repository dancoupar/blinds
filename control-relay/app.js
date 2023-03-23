let http = require('http');
let url = require('url');
let fs = require('fs');

let subscribers = Object.create(null);

const allowedCommands = [
  'UP',
  'DOWN',
  'STOP'
];

function onSubscribe(req, res) {
  let id = Math.floor(Math.random() * 1000000);

  res.setHeader('Content-Type', 'text/plain;charset=utf-8');
  res.setHeader("Cache-Control", "no-cache, must-revalidate");

  subscribers[id] = res;

  console.log('received new request ' + id);
  console.log('awaiting command');

  req.on('close', function() {
    delete subscribers[id];
  });
}

function publish(command) {
  for (let id in subscribers) {
    let res = subscribers[id];
    console.log('responding to request ' + id + ' with command ' + command);
    res.end(command);
  }

  subscribers = Object.create(null);
}

function accept(req, res) {
  let urlParsed = url.parse(req.url, true);

  // Listen for subscribers
  if (urlParsed.pathname === '/subscribe' && req.method === 'GET') {
    onSubscribe(req, res);
    return;
  }
  
  // Listen for commands
  if (urlParsed.pathname === '/ctrl' && req.method === 'GET') {
    let command = urlParsed.query.cmd;
    if (commandAllowed(command)) {
      console.log('received command ' + command);
      publish(command);
    }
    else {
      console.log('received bad command');
      res.writeHead(400);
    }
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
  return;
}

function commandAllowed(command) {
  for (let i = 0; i < allowedCommands.length; i++) {
    if (allowedCommands[i] === command) {
      return true;
    }
  }
  return false;
}

function close() {
  for (let id in subscribers) {
    let res = subscribers[id];
    res.end();
  }
}

// -----------------------------------

const port = parseInt(process.env.PORT) || 8080;
http.createServer(accept).listen(port);
console.log('server running on port ' + port);
