let http = require('http');
let url = require('url');

let subscribers = Object.create(null);

const allowedCommands = [
  'up',
  'down',
  'stop'
];

function onSubscribe(request, response) {
  let id = Math.floor(Math.random() * 1000000);
  response.setHeader("Cache-Control", "no-cache, must-revalidate");
  subscribers[id] = response;
  console.log('received new request ' + id);
  console.log('awaiting command');
  request.on('close', function() {
    console.log('request ' + id + ' closed');
    delete subscribers[id];
  });
}

function publish(command) {
  for (let id in subscribers) {
    let response = subscribers[id];
    console.log('responding to request ' + id + ' with command ' + command.toUpperCase());
    response.end(command);
  }
  subscribers = Object.create(null);
}

function accept(request, response) {
  response.setHeader('Content-Type', 'text/plain;charset=utf-8');
  if (!authorise(request)) {
    response.writeHead(401, { 'WWW-Authenticate': 'Basic' });
    response.end();
    return;
  }
  request.on('error', function(err) {
    console.error('request error: ' + err);
  });
  response.on('error', function(err) {
    console.error('response error: ' + err);
  });
  let urlParsed = url.parse(request.url, false);
  if (urlParsed.pathname === '/subscribe') {
    processSubscribe(request, response);
    return;
  }  
  if (urlParsed.pathname === '/ctrl') {
    processControlCommand(request, response);
    return;
  }
  response.writeHead(404);
  response.end();
}

function processSubscribe(request, response) {
  if (request.method !== 'GET') {
    response.writeHead(405);
    response.end();
    return;
  }
  onSubscribe(request, response);
}

function processControlCommand(request, response) {
  if (request.method !== 'POST') {
    response.writeHead(405);
    response.end();
    return;
  }  
  let command = url.parse(request.url, true).query.cmd;
  if (command === undefined) {
    response.writeHead(400);
    response.end();
    return;
  }
  if (!commandAllowed(command)) {
    console.error('received bad command: ' + command.toUpperCase());
    response.writeHead(400);
    response.end();
    return;
  }
  console.log('received command: ' + command.toUpperCase());
  publish(command);
  response.end();
}

function authorise(request) {
  try {
    let splitHeader = request.headers['authorization'].split(' ');
    if (splitHeader.length !== 2 || splitHeader[0].toLowerCase() !== 'basic') {
      return false;
    }
    // No username, but trim off leading :
    if (Buffer.from(splitHeader[1], 'base64').toString().substring(1) !== process.env.CLIENT_KEY) {
      return false;
    }
  }
  catch {
    return false;
  }
  return true;
}

function commandAllowed(command) {
  for (let i = 0; i < allowedCommands.length; i++) {
    if (allowedCommands[i] === command) {
      return true;
    }
  }
  return false;
}

// -----------------------------------

const port = parseInt(process.env.PORT) || 8080;
const server = http.createServer(accept);
server.timeout = 86400000; // 1 day
server.requestTimeout = 86400000; // 1 day
server.listen(port);
console.log('server running on port ' + port);
