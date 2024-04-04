// Importar módulos necesarios
import express from "express";
import * as fs from "fs";
import bodyParser  from "body-parser";
import jwt from "jsonwebtoken";
import axios from 'axios';

//Hola tuve algubos problemas con la autentifiacion de Token, pero las demas rutas funiconan bien (puede probarlas comentando el codigo que tiene que ver con el token de sesion)


const app = express();
const secretKey = 'tu_clave_secreta'; // Clave secreta para JWT

// Middleware para parsear el body de las solicitudes
app.use(express.json());


// Función para generar un token JWT
function generateToken(user: string): string {
  return jwt.sign({ user }, secretKey, { expiresIn: '1h' });
}

// Middleware de autenticación JWT
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(400).send('Se requiere un token de autenticación');
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    (req as any).user = (decoded as any).user; // Almacenar el usuario en el objeto de solicitud para usarlo en los controladores
    next();
  } catch (error) {
    return res.status(401).send('Token de autenticación inválido o caducado');
  }
}

// Ruta para autenticación y generación de token JWT
app.post('/auth', (req: express.Request, res: express.Response) => {
  const { user, password } = req.body;

  // Verificar las credenciales (puedes implementar tu lógica de autenticación aquí)
  if (user === 'user4' && password === 'pass4#') {
    // Generar un token JWT válido
    const token = generateToken(user);
    res.json({ token });
  } else {
    res.status(401).send('Credenciales inválidas');
  }
});

// Middleware de autenticación JWT para proteger las rutas necesarias
app.use(authenticate);


// URL del servidor donde está alojada la aplicación
const serverUrl = 'http://localhost:3000'; // Reemplaza con tu URL real si es diferente

// Datos de inicio de sesión
const credentials = {
  user: 'user4',
  password: 'pass4#'
};

// Realizar una solicitud POST al endpoint /auth para obtener el token JWT
axios.post(`${serverUrl}/auth`, credentials)
  .then(response => {
    const token = response.data?.token; // Acceder al token dentro de la respuesta
    if (!token) {
      throw new Error('Token no recibido');
    }
    console.log('Token JWT:', token);

    // Ahora puedes usar el token en tus solicitudes posteriores
    // Por ejemplo, aquí podrías realizar una solicitud GET a /books usando el token en el encabezado de autorización
  })
  .catch(error => {
    console.error('Error al obtener el token JWT:', error.message);
  });

  const token = 'tu_token_jwt'; // Aquí se debe almacenar el token que se recibe después de la autenticación

  // Realizar una solicitud GET a una ruta protegida, por ejemplo, "/protected"
  axios.get(`${serverUrl}/protected`, {
    headers: {
      'Authorization': `Bearer ${token}` // Adjunta el token JWT como un encabezado de autorización
    }
  })
  .then(response => {
    console.log('Datos de la ruta protegida:', response.data);
  })
  .catch(error => {
    console.error('Error al acceder a la ruta protegida:', error);
  });

// Definir una ruta para el endpoint de "hello world"
app.get("/hello", (_req, res) => {
  res.status(200).send("Hello, world!");
});

// Definir una ruta para el endpoint de obtener libros
app.get("/books", authenticate, (_req, res) => {
  // Leer el archivo JSON de libros
  fs.readFile("MOCK_DATA.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de libros:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }
    // Convirte los datos en formato JSON
    const books = JSON.parse(data);
    // Responder con los libros en formato JSON
    res.status(200).json(books);
  });
});

// Definir una ruta para obtener un libro por su ID
app.get("/books/:id", authenticate, (req, res) => {
  const bookId = req.params.id; // Obtener el ID del parámetro de la URL

  // Leer el archivo JSON de libros
  fs.readFile("MOCK_DATA.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo de libros:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }

    // Convertir los datos en formato JSON
    const books = JSON.parse(data);

    // Buscar el libro por su ID
    const book = books.find((book: { id: string }) => book.id === bookId);

    // Verificar si se encontró el libro
    if (book) {
      // Responder con el libro encontrado en formato JSON
      res.status(200).json(book);
    } else {
      // Si no se encontró el libro, responder con un código de estado 400
      res.status(400).send("ID de libro no encontrado");
    }
  });
});

// Definir una ruta para obtener libros por precio
app.get("/books1", authenticate, (req, res) => {
  const priceParam = req.query.price;

  // Verificar si se proporcionó un precio y si es un número válido
  if (!priceParam || isNaN(Number(priceParam))) {
    return res.status(400).send('El parámetro "price" debe ser un número');
  }

  const price = Number(priceParam); // Convertir el precio a un número

  // Leer el archivo JSON de libros
  fs.readFile("MOCK_DATA.json", "utf8", (err, data: string) => {
    if (err) {
      console.error("Error al leer el archivo de libros:", err);
      return res.status(500).send("Error interno del servidor");
    }

    try {
      const books = JSON.parse(data);

      // Filtrar los libros que son más caros que el precio proporcionado
      const expensiveBooks = books.filter(
        (book: { price: number }) => book.price > price,
      );

      if (expensiveBooks.length === 0) {
        return res
          .status(404)
          .send(
            "No se encontraron libros más caros que el precio proporcionado",
          );
      }

      // Responder con los libros encontrados en formato JSON
      return res.status(200).json(expensiveBooks);
    } catch (error) {
      console.error("Error al analizar el archivo JSON de libros:", error);
      return res
        .status(500)
        .send("Error al analizar el archivo JSON de libros");
    }
  });
});

// Usar el middleware bodyParser para el registro de un nuevo libro
app.use(bodyParser.json());


// Definir una ruta para crear un nuevo libro
app.post("/newbook", authenticate, (req, res) => {
  // Obtener los datos del cuerpo de la solicitud
  const {
    title,
    author,
    price,
    availability,
    num_reviews,
    stars,
    description,
  } = req.body;

  // Verificar si se proporcionaron todos los campos necesarios
  if (
    !title ||
    !author ||
    !price ||
    !availability ||
    !num_reviews ||
    !stars ||
    !description
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  // Verificar si el precio es un número válido
  if (isNaN(price)) {
    return res.status(400).json({ message: "El precio debe ser un número" });
  }

  // Crear un nuevo libro
  const newBook = {
    id: Math.random().toString(36).substring(7), // Generar un ID único
    title,
    author,
    price,
    availability,
    num_reviews,
    stars,
    description,
  };

  // Leer el archivo JSON de libros
  fs.readFile('MOCK_DATA.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de libros:', err);
      return res.status(500).send('Error interno del servidor');
    }

    let books = [];
    try {
      // Convertir los datos en formato JSON
      books = JSON.parse(data);
    } catch (error) {
      console.error('Error al analizar el archivo JSON de libros:', error);
      return res.status(500).send('Error al analizar el archivo JSON de libros');
    }

    // Agregar el nuevo libro al array de libros
    books.push(newBook);

    // Escribir el array actualizado de libros en el archivo JSON
    fs.writeFile('MOCK_DATA.json', JSON.stringify(books), (err) => {
      if (err) {
        console.error('Error al escribir en el archivo de libros:', err);
        return res.status(500).send('Error interno del servidor');
      }

      // Responder con el nuevo libro creado
      return res.status(201).json(newBook);
    });
  });
});


// Definir una ruta para obtener libros que incluyan una frase en el nombre del autor
app.get("/books2", authenticate, (req, res) => {
  const phrase = req.query.phrase as string;

  // Verificar si se proporcionó una frase y si contiene solo letras del alfabeto
  if (!phrase || !/^[a-zA-Z]+$/.test(phrase)) {
    return res
      .status(400)
      .send("La frase debe contener solo letras del alfabeto");
  }

  // Leer el archivo JSON de libros
  fs.readFile("MOCK_DATA.json", "utf8", (err, data: string) => {
    if (err) {
      console.error("Error al leer el archivo de libros:", err);
      return res.status(500).send("Error interno del servidor");
    }

    try {
      const books = JSON.parse(data);

      // Filtrar los libros que incluyan la frase en el nombre del autor
      const booksWithPhrase = books.filter((book: any) =>
        phrase
          .split("")
          .every((letter) =>
            (book.author as string)
              .toLowerCase()
              .includes(letter.toLowerCase()),
          ),
      );

      if (booksWithPhrase.length === 0) {
        return res
          .status(404)
          .send(
            "No se encontraron libros que incluyan la frase en el nombre del autor",
          );
      }

      // Responder con los libros encontrados en formato JSON
      return res.status(200).json(booksWithPhrase);
    } catch (error) {
      console.error("Error al analizar el archivo JSON de libros:", error);
      return res
        .status(500)
        .send("Error al analizar el archivo JSON de libros");
    }
  });
});

// Definir una ruta para obtener el costo promedio de cada libro
app.get("/books3/average", authenticate, (_req, res) => {
  // Leer el archivo JSON de libros
  fs.readFile("MOCK_DATA.json", "utf8", (err, data: string) => {
    if (err) {
      console.error("Error al leer el archivo de libros:", err);
      return res.status(500).send("Error interno del servidor");
    }

    try {
      const books = JSON.parse(data);

      // Calcular el costo promedio de los libros
      const totalCost = books.reduce(
        (acc: number, book: any) => acc + book.price,
        0,
      );
      const averageCost = totalCost / books.length;

      // Responder con el costo promedio en formato JSON
      return res.status(200).json({ average: averageCost.toFixed(2) });
    } catch (error) {
      console.error("Error al analizar el archivo JSON de libros:", error);
      return res
        .status(500)
        .send("Error al analizar el archivo JSON de libros");
    }
  });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000; // Puerto 3000 por defecto
app.listen(PORT, () => {
  console.log(`El servidor está corriendo en el puerto ${PORT}`);
});
