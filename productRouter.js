const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const productos = require('./productos');

const router = express.Router();

//Confirmo o creo el directorio donde se almacenaran las imagenes...
(() => {
	fs.promises.mkdir('./public/uploads').then(() => console.log('Directorio uploads creado!')).catch((err) => {
		if (err.code === 'EEXIST') return console.log('Directorio uploads creado!');
		console.log(err);
	});
})();

const getExtension = (fileType) => fileType.split('/')[1];
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, path.join(__dirname, './public/uploads')),
	filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}.${getExtension(file.mimetype)}`)
});
const upload = multer({ storage: storage });

//MIDDLEWARE
const productExists = (req, res, next) => {
	const producto = productos.getProduct(req.params.id)[0];
	if (!producto) return res.status(400).json({ error: 'producto no encontrado' });
	req.producto = producto;
	next();
};

//GET
router.get('/productos/listar', (req, res) => {
	const lista = productos.getList();
	if (!lista.length) return res.status(404).json({ error: 'no hay productos cargados' });
	res.status(200).json(lista);
});
router.get('/productos/listar/:id', productExists, (req, res) => {
	const { producto } = req;
	res.status(200).json(producto);
});
//POST
router.post('/productos/guardar/', upload.single('thumbnail'), (req, res) => {
	const dataKeys = [ 'title', 'price' ];
	const shapeMatches = dataKeys.every((el) => Object.keys(req.body).includes(el));
	if (!shapeMatches || !req.file)
		return res.status(400).json({ error: 'los datos proporcionados son insuficientes' });
	const newProducto = productos.addProduct({
		title: req.body.title,
		price: req.body.price,
		thumbnail: '/uploads/'+req.file.filename
	});
	res.status(201).json(newProducto);
});
//PUT
router.put('/productos/actualizar/:id', productExists, upload.single('thumbnail'), (req, res) => {
	const dataKeys = [ 'title', 'price' ];
	const keys = Object.keys(req.body).filter((el) => dataKeys.includes(el));
	const productToUpdate = {};
	keys.forEach((key) => (productToUpdate[key] = req.body[key]));
	if (!!req.file) productToUpdate.thumbnail = '/uploads/'+ req.file.filename;
	const updatedProduct = productos.updateProduct(req.params.id, productToUpdate);
	if (!updatedProduct) return res.status(400).json({ error: 'producto no encontrado' });
	res.status(200).json(updatedProduct);
});
//DELETE
router.delete('/productos/borrar/:id', productExists, async (req, res) => {
	try {
		const { producto } = req;
		if (producto.thumbnail.includes('uploads')) await fs.promises.unlink(`./public/${producto.thumbnail}`);
		productos.deleteProduct(req.params.id);
		res.status(200).json(producto);
	} catch (err) {
		res.status(404).json({ error: 'no fue posible completar la operación' });
	}
});

module.exports = router;
