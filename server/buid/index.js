"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Importar módulos necesarios
const express_1 = __importDefault(require("express"));
// Crear la aplicación Express
const app = (0, express_1.default)();
// Definir una ruta para el endpoint de "hello world"
app.get('/hello', (_req, res) => {
    res.status(200).send('Hello, world!');
});
// Iniciar el servidor
const PORT = process.env.PORT || 3000; // Puerto 3000 por defecto
app.listen(PORT, () => {
    console.log(`El servidor está corriendo en el puerto ${PORT}`);
});
