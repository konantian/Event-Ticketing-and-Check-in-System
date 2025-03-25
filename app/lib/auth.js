// Simplified auth utility for testing - no JWT

export function isRole(user, allowedRoles) {
  return user && allowedRoles.includes(user.role);
}

export async function verifyAuth(req) {
  // For testing, check if test header is present
  const testAuthHeader = req.headers.get('X-Test-Auth-User');
  
  if (testAuthHeader) {
    try {
      const user = JSON.parse(testAuthHeader);
      return { authorized: true, user };
    } catch (error) {
      return { authorized: false, error: 'Invalid test auth header' };
    }
  }
  
  // No auth header found
  return { authorized: false, error: 'No authentication header found' };
}

export function unauthorized() {
  return new Response(
    JSON.stringify({ success: false, message: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

export function forbidden() {
  return new Response(
    JSON.stringify({ success: false, message: 'Forbidden' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
} 