const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader); // Debug

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded); // Debug

    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token: No userId found' });
    }

    // Isi req.user
    req.user = {
      id: decoded.userId, // Mapping userId ke id
      email: decoded.email,
    };
    console.log('req.user:', req.user); // Debug

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;