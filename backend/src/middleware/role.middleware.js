export function requireVendor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ error: 'Vendor access only' });
  }
  next();
}
