const http = require('http');
const url = require('url');

let subscribers = Object.create(null);

const allowedCommands = [
  'up',
  'down',
  'stop'
];

const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'text/plain;charset=utf-8');
    const urlParsed = url.parse(request.url, false);
    if (urlParsed.pathname === '/health' && request.method === 'GET') {
      response.end('Healthy');
      return;
    }
    if (!authorise(request)) {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic' });
      response.end();
      return;
    }
    request.on('error', (err) => {
      console.error('request error: ' + err);
    });
    response.on('error', (err) => {
      console.error('response error: ' + err);
    });
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
});

const port = parseInt(process.env.PORT) || 8080;
server.listen(port);
console.log('server running on port ' + port);

function onSubscribe(request, response) {
  const id = generateRequestId();
  response.setHeader('Cache-Control', 'no-cache, must-revalidate');
  subscribers[id] = response;
  console.log('received new request ' + id + '(' + + ')');
  console.log('awaiting command');
  const timeoutInSeconds = 10;
  response.timeoutId = setTimeout(timeoutInSeconds * 1000, () => {
    response.writeHead(504);
    response.end();
  });
  request.on('close', () => {
    console.log('request ' + id + ' closed');
    clearTimeout(response.timeoutId);
    delete subscribers[id];
  });
}

function publish(command) {
  for (let id in subscribers) {
    const response = subscribers[id];
    clearTimeout(response.timeoutId);
    console.log('responding to request ' + id + ' with command ' + command.toUpperCase());
    response.end(command);
  }
  subscribers = Object.create(null);
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
    console.error('received bad command ' + command.toUpperCase());
    response.writeHead(400);
    response.end();
    return;
  }
  console.log('received command ' + command.toUpperCase());
  publish(command);
  response.end();
}

function authorise(request) {  
  try {
    const splitHeader = request.headers['authorization'].split(' ');
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

function generateRequestId() { 
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += (Math.floor(Math.random() * 16)).toString(16);
  }
  return id;
}

function commandAllowed(command) {
  for (let i = 0; i < allowedCommands.length; i++) {
    if (allowedCommands[i] === command) {
      return true;
    }
  }
  return false;
}
