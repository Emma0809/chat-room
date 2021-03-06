/*
 * Module dependencies
 */
var express = require('express')
  , net = require('net')
  , io = require('socket.io')

var app = express();
var words='';

app.set('port', process.env.PORT || 3001);		//setup port to run express + socket.io
app.set('views', __dirname + '/views')			//link views (front end files folder (JADE))
app.set('view engine', 'jade')					//setup engine
app.use(express.logger('dev'))					//logger = dev, Not important
app.use(express.favicon());

app.use(express.static(__dirname + '/public'))	//setup the public folder for assetts (js, css files)

io = require('socket.io').listen(app.listen(app.get('port')));		//init socket.io to listen on port
console.log('Websocket server listening on port ' + app.get('port'));	//debug message for us

console.log('prepare connection');                                                                                                            
var tcpserver = net.createServer();

var clients = [];

var message;
var username;
var server;
tcpserver.on('connection',function (server) {
  var name;
  
    
    server.on('data',function(mes){   
      if(name == undefined)//accept the name
      {
        name = mes;
        var nameRs = name.toString().split('\\');
        console.log(nameRs.length);
        console.log(nameRs);
        server.name = nameRs[0];
        clients.push(server);
        server.write('Welcome to the chat room,'+name);
        broadcast(server.name+' +join!\r\n',server);
      }
      else    //deal with data from tcp socket
      {
        var nowTime = new Date().toLocaleTimeString();
        message = '*'+nowTime+'-'+server.name+'-'+mes;
        broadcast(message,server);
        words = words+message;
        console.log('send data------');
        io.sockets.emit('my other event',words);//send to browser
      }
    });  

    server.on('end',function(){
      broadcast(server.name + ' quit!\r\n',server);
      clients.splice(clients.indexOf(server),1);
    });
 
});

io.sockets.on('connection',function(socket){
    socket.on('name',function(res){    //name from browser
          username = res;
          console.log('Name:',res);  
         
          //server.write('Welcome to the chat room,'+res);
          //server.write('\n');
          broadcast(res+' +join!\r\n',socket);  
         
      });

	  socket.on('data',function(res){   //data from browser
        words=words+res;
        console.log(words); 
        io.sockets.emit('my other event',words);   
        
        broadcast(res,socket);  //send to tcp socket    
  });
});


function broadcast(message,server){
  var cleanup = [];
  for(var i=0;i<clients.length;i++){
      console.log('----------'+i);
  //  if(server != clients[i]){
      if(clients[i].writable){
        clients[i].write(message);
      }
      else{
        cleanup.push(clients[i]);
        clients[i].destroy();
      }
   // }
  }

  for(var i=0;i<cleanup.length;i++){
    clients.splice(clients[i].indexOf(cleanup[i]),1);
  }
}

tcpserver.listen(8001);

app.get('/', function (req, res) {			//root route, when / is requested in the browser
  console.log('go to index route');
  globalRes=res;
  res.render('index',{ title : 'Home' });
  console.log('render index');
});


app.get('/chat',function(req,res){
	console.log('go to chat route');
	res.render('chat',{title:'chat page'});
	console.log('render chat');
});

