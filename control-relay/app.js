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
  let id = Math.random();

  res.setHeader('Content-Type', 'text/plain;charset=utf-8');
  res.setHeader("Cache-Control", "no-cache, must-revalidate");

  subscribers[id] = res;

  console.log('Registered new subscriber ' + id);

  req.on('close', function() {
    delete subscribers[id];
  });

}

function publish(command) {

  for (let id in subscribers) {
    let res = subscribers[id];
    res.end(command);
  }

  subscribers = Object.create(null);
}

function accept(req, res) {
  let urlParsed = url.parse(req.url, true);

  // new client wants messages
  if (urlParsed.pathname === '/subscribe' && req.method === 'GET') {
    onSubscribe(req, res);
    return;
  }

  // sending a message
  if (urlParsed.pathname === '/ctrl' && req.method === 'GET') {
    // accept POST
    let command = urlParsed.query.cmd;
    if (commandAllowed(command)) {
      publish(command); // publish it to everyone
    }
    else {
      res.writeHead(400);
    }
    res.end();
    return;
  }

  /*
  let filename = 'index.html';
  if (urlParsed.pathname == '/client.js') {
    filename = 'client.js';
  }
  
  fs.readFile(__dirname + '/' + filename, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
  */

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
console.log('Server running on port ' + port);
