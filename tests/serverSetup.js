const request = require('supertest');
const http = require('http');

// Create a simple mock Next.js API route handler
function createMockAPIHandler(req, res, handler, user = null) {
  // Add method, query, and body to request object
  req.method = req.method || 'GET';
  req.query = req.query || {};
  req.body = req.body || {};
  
  // Define the headers getter
  req.headers = {
    get: (name) => {
      if (name === 'Content-Type') return 'application/json';
      if (name === 'X-Test-Auth-User' && user) {
        return JSON.stringify(user);
      }
      return null;
    }
  };
  
  // Define NextResponse-like methods on response object
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  
  res.json = function(data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
    return this;
  };
  
  // If user is provided, attach it to the request object
  if (user) {
    req.user = user;
  }
  
  // Call the API route handler
  return handler(req, res);
}

// Helper function to test API routes
function testRoute(handler, { method = 'GET', url = '/', body = null, params = {}, user = null }) {
  // Create a simple HTTP server
  const server = http.createServer((req, res) => {
    req.method = method;
    req.url = url;
    req.query = params;
    
    // Parse body
    if (body) {
      req.body = body;
    }
    
    createMockAPIHandler(req, res, handler, user);
  });
  
  return {
    request: request(server),
    server
  };
}

module.exports = {
  testRoute
}; 