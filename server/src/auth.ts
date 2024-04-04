import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Interfaz para describir la forma de los datos dentro del token JWT
interface MyJwtPayload extends JwtPayload {
  user: string;
}

// Clave secreta para JWT
const secretKey = 'tu_clave_secreta';

// Función para generar un token JWT
function generateToken(user: string): string {
  return jwt.sign({ user }, secretKey, { expiresIn: '1h' });
}

// Middleware de autenticación JWT
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(400).send('Se requiere un token de autenticación');
  }

  try {
    const decoded = jwt.verify(token, secretKey) as MyJwtPayload;
    req['user'] = decoded.user; // Almacenar el usuario en el objeto de solicitud para usarlo en los controladores
    next();
  } catch (error) {
    return res.status(401).send('Token de autenticación inválido o caducado');
  }
}

const router = express.Router();

// Ruta para autenticación y generación de token JWT
router.post('/auth', (req: Request, res: Response) => {
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

export default router;
