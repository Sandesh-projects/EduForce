// backend/src/middleware/quiz2.middleware.js
// This file re-exports specific authentication middlewares for student quiz routes.
import { authenticateUser, allowAuthenticated } from '../middleware/auth.middleware.js';

// Re-export the necessary middlewares for clean import in quiz2.routes.js
export { authenticateUser, allowAuthenticated };
