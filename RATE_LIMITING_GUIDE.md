# Rate Limiting Techniques Demonstration

This application demonstrates all popular rate limiting techniques implemented in a Node.js Express application. Each technique is carefully implemented with real-world examples and comprehensive documentation.

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Rate Limiting Techniques](#rate-limiting-techniques)
4. [API Endpoints](#api-endpoints)
5. [Testing Examples](#testing-examples)
6. [Monitoring & Statistics](#monitoring--statistics)
7. [Production Considerations](#production-considerations)

## Overview

Rate limiting is crucial for protecting APIs from abuse, ensuring fair usage, and maintaining service quality. This application implements seven different rate limiting techniques:

1. **Basic Rate Limiting** - Using express-rate-limit
2. **Sliding Window Rate Limiting** - More precise time windows
3. **Token Bucket Rate Limiting** - Allows burst traffic
4. **Fixed Window Rate Limiting** - Simple time-based windows
5. **Progressive Delay Rate Limiting** - Gradual response delays
6. **IP-based Rate Limiting** - Tier-based access control
7. **Custom Rate Limiting** - Manual implementation with full control

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the API**
   - Main API: `http://localhost:3000`
   - Rate Limiting Demo: `http://localhost:3000/api/rate-limit-demo`
   - Statistics: `http://localhost:3000/api/rate-limit-demo/stats`

## Rate Limiting Techniques

### 1. Basic Rate Limiting (express-rate-limit)

**Implementation**: `src/middlewares/rateLimiters/basicRateLimit.js`

The most straightforward approach using the popular `express-rate-limit` package.

**Features**:
- Fixed window approach
- Configurable limits and windows
- Standard HTTP headers
- IP-based tracking

**Use Cases**:
- General API protection
- Quick implementation
- Standard compliance

**Example Configuration**:
```javascript
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later.'
});
```

### 2. Sliding Window Rate Limiting

**Implementation**: `src/middlewares/rateLimiters/slidingWindowRateLimit.js`

More precise than fixed windows, maintains a continuous time window that slides forward.

**Features**:
- Prevents burst at window edges
- More accurate rate limiting
- Smooth distribution of requests
- Memory efficient with cleanup

**Benefits over Fixed Window**:
- No sudden reset allowing burst traffic
- More consistent protection
- Better user experience

**Example**:
```javascript
const slidingWindow = new SlidingWindowRateLimiter(60000, 30); // 30 requests per minute
```

### 3. Token Bucket Rate Limiting

**Implementation**: `src/middlewares/rateLimiters/tokenBucketRateLimit.js`

Allows burst traffic up to bucket capacity while maintaining average rate limits.

**Features**:
- Burst allowance
- Configurable refill rates
- Flexible token consumption
- Different tokens per request type

**Algorithm**:
1. Bucket starts with maximum tokens
2. Each request consumes tokens
3. Tokens refill at configured rate
4. Requests blocked when bucket empty

**Example**:
```javascript
const tokenBucket = new TokenBucketRateLimiter(20, 2, 1000); // 20 capacity, refill 2 per second
```

### 4. Fixed Window Rate Limiting

**Implementation**: `src/middlewares/rateLimiters/fixedWindowRateLimit.js`

Divides time into fixed intervals with request counters that reset at window boundaries.

**Features**:
- Simple to understand
- Memory efficient
- Predictable reset times
- Easy monitoring

**Characteristics**:
- Counter resets at fixed intervals
- Potential for burst at window edges
- Good for reporting and analytics

**Example**:
```javascript
const fixedWindow = new FixedWindowRateLimiter(60000, 60); // 60 requests per minute
```

### 5. Progressive Delay Rate Limiting

**Implementation**: `src/middlewares/rateLimiters/progressiveDelayRateLimit.js`

Instead of blocking requests, gradually increases response delays.

**Features**:
- Graceful degradation
- Better user experience
- Configurable delay strategies
- Adaptive based on system load

**Delay Strategies**:
- Linear increase
- Exponential backoff
- Adaptive based on load
- Maximum delay caps

**Example**:
```javascript
const progressiveDelay = new CustomProgressiveDelay({
    threshold: 15,
    baseDelay: 100,
    maxDelay: 3000,
    delayMultiplier: 1.5
});
```

### 6. IP-based Rate Limiting with Tiers

**Implementation**: `src/middlewares/rateLimiters/ipBasedRateLimit.js`

Sophisticated IP-based limiting with different service tiers.

**Features**:
- IP whitelisting/blacklisting
- Tier-based limits (premium, standard, limited, suspicious)
- Geographic restrictions
- Dynamic tier adjustment
- Violation tracking

**Tiers**:
- **Premium**: 1000 requests/minute
- **Standard**: 100 requests/minute
- **Limited**: 20 requests/minute
- **Suspicious**: 5 requests/minute

**Example**:
```javascript
const ipLimiter = new IPBasedRateLimiter();
ipLimiter.setIPTier('192.168.1.100', 'premium');
ipLimiter.whitelistIP('10.0.0.1');
```

### 7. Custom Rate Limiting Middleware

**Implementation**: `src/middlewares/rateLimiters/customRateLimit.js`

Comprehensive implementation providing full control over rate limiting logic.

**Features**:
- Multiple algorithms in one class
- Custom key generation
- Advanced statistics
- Flexible storage options
- Custom response handling

**Algorithms Supported**:
- Fixed window
- Sliding window
- Token bucket

**Example**:
```javascript
const customLimiter = new CustomRateLimiter({
    algorithm: 'sliding_window',
    windowMs: 60000,
    maxRequests: 100,
    keyGenerator: (req) => `${req.ip}:${req.user?.id || 'anonymous'}`
});
```

## API Endpoints

### Todo API (with Rate Limiting Applied)

- `GET /api/todo` - Get all todos (lenient rate limiting)
- `GET /api/todo/:id` - Get single todo (sliding window)
- `POST /api/todo` - Create todo (strict rate limiting)
- `PUT /api/todo/:id` - Update todo (moderate rate limiting)
- `DELETE /api/todo/:id` - Delete todo (very strict, heavy operation)
- `DELETE /api/todo` - Delete all todos (high security)

### Rate Limiting Demo Endpoints

#### Algorithm Demonstrations
- `GET /api/rate-limit-demo/demo/fixed-window` - Fixed window demo
- `GET /api/rate-limit-demo/demo/sliding-window` - Sliding window demo
- `GET /api/rate-limit-demo/demo/token-bucket` - Token bucket demo
- `GET /api/rate-limit-demo/demo/progressive-delay` - Progressive delay demo

#### IP-based Limiting
- `GET /api/rate-limit-demo/demo/ip-based` - IP tier demonstration
- `GET /api/rate-limit-demo/demo/geo-based` - Geographic limiting

#### Operation Types
- `GET /api/rate-limit-demo/data` - Read operation (lenient)
- `POST /api/rate-limit-demo/create` - Write operation (strict)
- `PUT /api/rate-limit-demo/update/:id` - Update operation (moderate)
- `DELETE /api/rate-limit-demo/delete/:id` - Delete operation (very strict)

#### Authentication Simulation
- `POST /api/rate-limit-demo/auth/login` - Login attempts (5 per 15 min)
- `POST /api/rate-limit-demo/auth/reset-password` - Password reset (very strict)

#### Advanced Features
- `POST /api/rate-limit-demo/protected/multi-layer` - Multiple techniques combined
- `GET /api/rate-limit-demo/demo/user-based` - User-specific limits
- `GET /api/rate-limit-demo/demo/endpoint-specific` - Endpoint-specific limits

#### Monitoring
- `GET /api/rate-limit-demo/stats` - Comprehensive statistics
- `GET /api/rate-limit-demo/health` - Health check (no rate limiting)

## Testing Examples

### Basic Testing with curl

1. **Test Basic Rate Limiting**:
   ```bash
   # Make multiple requests to see rate limiting in action
   for i in {1..50}; do
     curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/todo
   done
   ```

2. **Test Progressive Delay**:
   ```bash
   # Time responses to see increasing delays
   for i in {1..20}; do
     echo "Request $i:"
     time curl -s http://localhost:3000/api/rate-limit-demo/demo/progressive-delay
   done
   ```

3. **Test Token Bucket**:
   ```bash
   # Rapid requests to exhaust bucket
   for i in {1..25}; do
     curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" \
       http://localhost:3000/api/rate-limit-demo/demo/token-bucket
   done
   ```

4. **Test IP-based Limiting**:
   ```bash
   # Check your IP tier
   curl -s http://localhost:3000/api/rate-limit-demo/demo/ip-based | jq
   ```

### Advanced Testing Script

Create a file `test-rate-limits.js`:

```javascript
const axios = require('axios');

async function testEndpoint(url, requests = 20, delay = 100) {
    console.log(`\nTesting: ${url}`);
    console.log(`Making ${requests} requests with ${delay}ms delay between requests\n`);
    
    for (let i = 1; i <= requests; i++) {
        try {
            const start = Date.now();
            const response = await axios.get(url);
            const duration = Date.now() - start;
            
            console.log(`Request ${i}: ${response.status} (${duration}ms)`);
            
            // Log rate limit headers
            const headers = response.headers;
            if (headers['x-ratelimit-remaining']) {
                console.log(`  Remaining: ${headers['x-ratelimit-remaining']}`);
            }
            
        } catch (error) {
            console.log(`Request ${i}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
            
            if (error.response?.headers['retry-after']) {
                console.log(`  Retry after: ${error.response.headers['retry-after']}s`);
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Test different endpoints
async function runTests() {
    await testEndpoint('http://localhost:3000/api/rate-limit-demo/demo/fixed-window', 15, 50);
    await testEndpoint('http://localhost:3000/api/rate-limit-demo/demo/token-bucket', 25, 100);
    await testEndpoint('http://localhost:3000/api/rate-limit-demo/demo/progressive-delay', 20, 200);
}

runTests().catch(console.error);
```

## Monitoring & Statistics

### Real-time Statistics

Access comprehensive statistics at: `GET /api/rate-limit-demo/stats`

**Statistics Include**:
- Active IP addresses per tier
- Request counts by algorithm
- Blocked request percentages
- Average delays applied
- Memory usage by rate limiters

### Response Headers

All rate limiting middleware adds informative headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-01-15T10:30:00.000Z
X-RateLimit-Type: sliding_window
Retry-After: 45
```

### Logging and Monitoring

Rate limiting events are logged with details:
- IP address
- Rate limit type
- Violation reason
- Timestamp
- Request details

## Production Considerations

### 1. Storage Options

**In-Memory (Current Implementation)**:
- Fast access
- No external dependencies
- Limited to single server
- Data lost on restart

**Redis (Recommended for Production)**:
```javascript
const redis = require('redis');
const client = redis.createClient();

// Use Redis for distributed rate limiting
const redisStore = {
    get: (key) => client.get(key),
    set: (key, value, ttl) => client.setex(key, ttl, value),
    del: (key) => client.del(key)
};
```

### 2. Performance Optimization

- **Cleanup Intervals**: Configure appropriate cleanup frequencies
- **Memory Monitoring**: Monitor memory usage for large-scale applications
- **Async Operations**: Use async/await for storage operations
- **Caching**: Cache frequently accessed data

### 3. Security Considerations

- **DDoS Protection**: Combine with DDoS protection services
- **IP Validation**: Validate and sanitize IP addresses
- **Header Spoofing**: Be aware of X-Forwarded-For header spoofing
- **Rate Limit Bypass**: Implement proper key generation

### 4. Monitoring and Alerting

- **Metrics Collection**: Collect rate limiting metrics
- **Alerting**: Set up alerts for unusual patterns
- **Dashboard**: Create monitoring dashboards
- **Logs**: Centralized logging for analysis

### 5. Configuration Management

```javascript
// Environment-based configuration
const config = {
    development: {
        rateLimits: {
            general: { windowMs: 60000, max: 1000 },
            strict: { windowMs: 60000, max: 100 }
        }
    },
    production: {
        rateLimits: {
            general: { windowMs: 60000, max: 100 },
            strict: { windowMs: 60000, max: 10 }
        }
    }
};
```

### 6. Testing in Production

- **Gradual Rollout**: Implement rate limiting gradually
- **A/B Testing**: Test different configurations
- **Monitoring**: Closely monitor after deployment
- **Rollback Plan**: Have rollback procedures ready

## Advanced Features

### Custom Key Generation

```javascript
// User + IP based limiting
keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip;
    return `${userId}:${ip}`;
}

// API key based limiting
keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] || req.ip;
    return `api:${apiKey}`;
}
```

### Bypass Conditions

```javascript
// Skip rate limiting for certain conditions
skip: (req) => {
    // Skip for health checks
    if (req.path === '/health') return true;
    
    // Skip for premium users
    if (req.user?.tier === 'premium') return true;
    
    // Skip for internal services
    if (req.ip.startsWith('10.0.')) return true;
    
    return false;
}
```

### Custom Responses

```javascript
// Custom error responses
customResponse: (req, res, rateLimitInfo) => {
    res.status(429).json({
        error: 'Too Many Requests',
        message: 'Please slow down your requests',
        retryAfter: rateLimitInfo.retryAfter,
        documentation: 'https://api.example.com/docs/rate-limits'
    });
}
```

## Best Practices

1. **Choose the Right Algorithm**: Match the algorithm to your use case
2. **Combine Techniques**: Use multiple rate limiting strategies
3. **Monitor Continuously**: Track metrics and adjust limits
4. **Document Limits**: Clearly communicate limits to API users
5. **Graceful Degradation**: Implement progressive delays before hard blocks
6. **Test Thoroughly**: Test all scenarios including edge cases
7. **Plan for Scale**: Use distributed storage for multi-server deployments

## Conclusion

This comprehensive rate limiting implementation demonstrates all major techniques used in production systems. Each approach has its strengths and is suitable for different scenarios. The key is to understand your specific requirements and choose the appropriate combination of techniques.

For questions or improvements, please refer to the code documentation or create an issue in the repository.
