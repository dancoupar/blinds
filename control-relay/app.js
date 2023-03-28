let http = require('http');
let url = require('url');
let fs = require('fs');

let subscribers = Object.create(null);

const allowedCommands = [
  'up',
  'down',
  'stop'
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

  res.on('end', function() {
    console.log('response ended for request ' + id);
  });
}

function publish(command) {
  for (let id in subscribers) {
    let res = subscribers[id];
    console.log('responding to request ' + id + ' with command ' + command.toUpperCase());
    res.end(command);
  }

  subscribers = Object.create(null);
}

function accept(req, res) {
  req.on('error', function(err) {
    console.log('request error: ' + err);
  });
  res.on('error', function(err) {
    console.log('response error: ' + err);
  });
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
      console.log('received command ' + command.toUpperCase());
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
const server = http.createServer(accept);
server.requestTimeout = 86400000; 
server.listen(port);
console.log('server running on port ' + port);
