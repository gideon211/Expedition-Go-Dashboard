import { z } from 'zod';

/**
 * Environment Variable Validation Schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_BASE_URL: z.string().url('API_BASE_URL must be a valid URL'),
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()),
  VITE_API_RETRY_ATTEMPTS: z.string().transform(Number).pipe(z.number().min(0).max(10)),

  // Authentication
  VITE_AUTH_PROVIDER: z.enum(['firebase', 'auth0', 'custom']),
  VITE_AUTH_API_BASE_URL: z.string().url(),
  VITE_TOKEN_REFRESH_INTERVAL: z.string().transform(Number).pipe(z.number().positive()),
  VITE_SESSION_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()),

  // Firebase (optional, required if auth provider is firebase)
  VITE_FIREBASE_API_KEY: z.string().optional(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().optional(),
  VITE_FIREBASE_APP_ID: z.string().optional(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),

  // Feature Flags
  VITE_FEATURE_ANALYTICS: z.string().transform((val) => val === 'true'),
  VITE_FEATURE_NOTIFICATIONS: z.string().transform((val) => val === 'true'),
  VITE_FEATURE_REAL_TIME_UPDATES: z.string().transform((val) => val === 'true'),
  VITE_FEATURE_ADVANCED_FILTERS: z.string().transform((val) => val === 'true'),
  VITE_FEATURE_EXPORT_DATA: z.string().transform((val) => val === 'true'),
  VITE_FEATURE_BULK_ACTIONS: z.string().transform((val) => val === 'true'),

  // Monitoring & Logging
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  VITE_DEBUG_MODE: z.string().transform((val) => val === 'true'),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),

  // Analytics
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().transform((val) => val === 'true'),

  // Application
  VITE_APP_NAME: z.string(),
  VITE_APP_VERSION: z.string(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']),
  VITE_BASE_URL: z.string(),

  // Performance
  VITE_ENABLE_SERVICE_WORKER: z.string().transform((val) => val === 'true'),
  VITE_CACHE_STRATEGY: z.enum(['network-first', 'cache-first', 'stale-while-revalidate']),

  // Upload
  VITE_MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()),
  VITE_ALLOWED_FILE_TYPES: z.string(),

  // Pagination
  VITE_DEFAULT_PAGE_SIZE: z.string().transform(Number).pipe(z.number().positive()),
  VITE_MAX_PAGE_SIZE: z.string().transform(Number).pipe(z.number().positive()),

  // Maps (optional)
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  VITE_MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // Third-party (optional)
  VITE_STRIPE_PUBLIC_KEY: z.string().optional(),
  VITE_INTERCOM_APP_ID: z.string().optional(),

  // Development Tools
  VITE_ENABLE_REACT_QUERY_DEVTOOLS: z.string().transform((val) => val === 'true'),
  VITE_ENABLE_REDUX_DEVTOOLS: z.string().transform((val) => val === 'true'),
  VITE_MOCK_API: z.string().transform((val) => val === 'true'),
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    const issues = error.issues || [];
    console.error('❌ Invalid environment variables:', issues);
    throw new Error(
      `Environment validation failed:\n${issues
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n')}`
    );
  }
}

// Validate environment variables on module load
const env = validateEnv();

/**
 * Application Configuration
 * Centralized configuration object with validated environment variables
 */
export const config = {
  // API Configuration
  api: {
    baseURL: env.VITE_API_BASE_URL,
    timeout: env.VITE_API_TIMEOUT,
    retryAttempts: env.VITE_API_RETRY_ATTEMPTS,
  },

  // Authentication Configuration
  auth: {
    provider: env.VITE_AUTH_PROVIDER,
    apiBaseURL: env.VITE_AUTH_API_BASE_URL,
    tokenRefreshInterval: env.VITE_TOKEN_REFRESH_INTERVAL,
    sessionTimeout: env.VITE_SESSION_TIMEOUT,
    firebase: {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    },
  },

  // Feature Flags
  features: {
    analytics: env.VITE_FEATURE_ANALYTICS,
    notifications: env.VITE_FEATURE_NOTIFICATIONS,
    realTimeUpdates: env.VITE_FEATURE_REAL_TIME_UPDATES,
    advancedFilters: env.VITE_FEATURE_ADVANCED_FILTERS,
    exportData: env.VITE_FEATURE_EXPORT_DATA,
    bulkActions: env.VITE_FEATURE_BULK_ACTIONS,
  },

  // Monitoring & Logging
  monitoring: {
    sentryDSN: env.VITE_SENTRY_DSN,
    sentryEnvironment: env.VITE_SENTRY_ENVIRONMENT,
    debugMode: env.VITE_DEBUG_MODE,
    logLevel: env.VITE_LOG_LEVEL,
  },

  // Analytics
  analytics: {
    gaMeasurementId: env.VITE_GA_MEASUREMENT_ID,
    enabled: env.VITE_ENABLE_ANALYTICS,
  },

  // Application
  app: {
    name: env.VITE_APP_NAME,
    version: env.VITE_APP_VERSION,
    environment: env.VITE_APP_ENV,
    baseURL: env.VITE_BASE_URL,
  },

  // Performance
  performance: {
    enableServiceWorker: env.VITE_ENABLE_SERVICE_WORKER,
    cacheStrategy: env.VITE_CACHE_STRATEGY,
  },

  // Upload
  upload: {
    maxFileSize: env.VITE_MAX_FILE_SIZE,
    allowedFileTypes: env.VITE_ALLOWED_FILE_TYPES.split(','),
  },

  // Pagination
  pagination: {
    defaultPageSize: env.VITE_DEFAULT_PAGE_SIZE,
    maxPageSize: env.VITE_MAX_PAGE_SIZE,
  },

  // Maps
  maps: {
    googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY,
    mapboxAccessToken: env.VITE_MAPBOX_ACCESS_TOKEN,
  },

  // Third-party Integrations
  integrations: {
    stripePublicKey: env.VITE_STRIPE_PUBLIC_KEY,
    intercomAppId: env.VITE_INTERCOM_APP_ID,
  },

  // Development Tools
  devTools: {
    enableReactQueryDevtools: env.VITE_ENABLE_REACT_QUERY_DEVTOOLS,
    enableReduxDevtools: env.VITE_ENABLE_REDUX_DEVTOOLS,
    mockAPI: env.VITE_MOCK_API,
  },

  // Helper methods
  isDevelopment: () => env.VITE_APP_ENV === 'development',
  isProduction: () => env.VITE_APP_ENV === 'production',
  isStaging: () => env.VITE_APP_ENV === 'staging',
};

// Log configuration in development
if (config.isDevelopment() && config.monitoring.debugMode) {
  console.log('📋 Application Configuration:', config);
}

export default config;
