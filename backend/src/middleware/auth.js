import jwt from 'jsonwebtoken';

export function authenticateBusiness(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'vnd_tech_jwt_secret_production_key_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.businessId = decoded.businessId;
    req.businessEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}
