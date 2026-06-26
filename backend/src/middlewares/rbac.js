/**
 * Restricts access based on user role.
 * @param {Array<string>} roles Allowed roles.
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized role' });
    }
    
    next();
  };
}

module.exports = {
  authorizeRoles
};
