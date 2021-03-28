const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const handlebars = require('express-handlebars');
const productRouter = require('./productRouter');
const vistaRouter = require('./vistaRouter');
const productos = require('./productos');

const PORT = 8080;

app.engine(
	'hbs',
	handlebars({
		extname: 'hbs',
		defaultLayout: 'index',
		layoutsDir: path.join(__dirname, '/views/layouts'),
		partialsDir: path.join(__dirname, '/views/partials')
	})
);
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

app.use('/productos', vistaRouter);
app.use('/api', productRouter);

//SOCKET
io.on('connection', (socket) => {
	console.log('Usuario conectado');
	socket.on('getUpdate', ()=>{
		const lista = productos.getList();
		if(!lista.length) return io.emit('update', {existe: false, lista: lista});
		io.emit('update', {existe: true, lista: lista});
	})
});

const server = http.listen(PORT, () =>
	console.log(`El servidor esta corriendo en el puerto: ${server.address().port}`)
);

server.on('error', (err) => console.log(`Error de servidor: ${err}`));
