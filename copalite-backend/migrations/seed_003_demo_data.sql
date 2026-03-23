-- ============================================
-- COPALITE v2.2 — Seed 003: Demo Data
-- Realistic demo data for client presentation
-- ============================================

DO $$
DECLARE
  ws_id UUID;
  prj_id UUID;
  src_id UUID;
  usr_id UUID;
BEGIN
  -- Get existing user
  SELECT id INTO usr_id FROM users LIMIT 1;

  -- Create demo workspace
  INSERT INTO workspaces (id, name, slug, description, status, owner_user_id, created_at, updated_at)
  VALUES (gen_random_uuid(), 'Acme Corporation', 'acme-corp', 'Enterprise software company', 'active', usr_id, NOW(), NOW())
  ON CONFLICT (slug) DO NOTHING;

  SELECT id INTO ws_id FROM workspaces WHERE slug = 'acme-corp';

  -- Add user as member
  INSERT INTO workspace_members (id, workspace_id, user_id, member_role, status, joined_at, created_at)
  VALUES (gen_random_uuid(), ws_id, usr_id, 'owner', 'active', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  -- Demo project
  INSERT INTO projects (id, workspace_id, name, slug, project_type, description, status, created_at, updated_at)
  VALUES (gen_random_uuid(), ws_id, 'Legacy ERP System', 'legacy-erp', 'legacy_system', 'PHP/MySQL ERP with 200+ modules, 15 years of technical debt', 'active', NOW(), NOW())
  ON CONFLICT DO NOTHING;

  SELECT id INTO prj_id FROM projects WHERE slug = 'legacy-erp';

  -- Source
  INSERT INTO sources (id, project_id, name, source_type, location, status, created_at, updated_at)
  VALUES (gen_random_uuid(), prj_id, 'GitHub Repository', 'repository', 'https://github.com/acme/legacy-erp', 'active', NOW(), NOW());

  SELECT id INTO src_id FROM sources WHERE project_id = prj_id LIMIT 1;

  -- Modules (8)
  INSERT INTO modules_registry (project_id, name, slug, layer_type, description, confidence_status) VALUES
  (prj_id, 'Authentication Module', 'auth-module', 'backend', 'Handles user login, JWT tokens, session management', 'confirmed'),
  (prj_id, 'Payment Gateway', 'payment-gateway', 'backend', 'Stripe + PayPal integration, handles transactions and refunds', 'confirmed'),
  (prj_id, 'Inventory Manager', 'inventory-manager', 'backend', 'Stock control, warehouse management, SKU tracking', 'inferred'),
  (prj_id, 'Dashboard Frontend', 'dashboard-frontend', 'frontend', 'React dashboard with charts, KPIs, real-time updates', 'confirmed'),
  (prj_id, 'Report Generator', 'report-generator', 'backend', 'PDF/Excel report generation for financial and inventory data', 'inferred'),
  (prj_id, 'Email Service', 'email-service', 'infra', 'SendGrid integration for transactional and marketing emails', 'confirmed'),
  (prj_id, 'User Management', 'user-management', 'backend', 'CRUD users, roles, permissions, RBAC', 'confirmed'),
  (prj_id, 'API Gateway', 'api-gateway', 'infra', 'Express middleware, rate limiting, request validation', 'inferred');

  -- APIs (10)
  INSERT INTO api_registry (project_id, name, http_method, path, description, auth_required, confidence_status) VALUES
  (prj_id, 'Login', 'POST', '/api/auth/login', 'Authenticates user and returns JWT', false, 'confirmed'),
  (prj_id, 'List Products', 'GET', '/api/products', 'Returns paginated product list with filters', true, 'confirmed'),
  (prj_id, 'Create Product', 'POST', '/api/products', 'Creates new product with SKU', true, 'confirmed'),
  (prj_id, 'Create Order', 'POST', '/api/orders', 'Creates new order with line items', true, 'confirmed'),
  (prj_id, 'Get Order', 'GET', '/api/orders/:id', 'Returns order details with items and payment status', true, 'confirmed'),
  (prj_id, 'Process Payment', 'POST', '/api/payments/charge', 'Charges customer via Stripe/PayPal', true, 'confirmed'),
  (prj_id, 'Generate Report', 'GET', '/api/reports/:type', 'Generates PDF/Excel report by type', true, 'inferred'),
  (prj_id, 'List Users', 'GET', '/api/users', 'Returns user list with roles', true, 'confirmed'),
  (prj_id, 'Update User', 'PATCH', '/api/users/:id', 'Updates user profile and permissions', true, 'confirmed'),
  (prj_id, 'Webhook Stripe', 'POST', '/api/webhooks/stripe', 'Receives Stripe payment events', false, 'confirmed');

  -- Routes (8)
  INSERT INTO route_registry (project_id, route_type, path, method, screen_name, description, confidence_status) VALUES
  (prj_id, 'frontend', '/login', 'GET', 'Login Page', 'Authentication form', 'confirmed'),
  (prj_id, 'frontend', '/dashboard', 'GET', 'Dashboard', 'Main dashboard with KPIs', 'confirmed'),
  (prj_id, 'frontend', '/products', 'GET', 'Product List', 'Product catalog with search', 'confirmed'),
  (prj_id, 'frontend', '/orders', 'GET', 'Order List', 'Order management with filters', 'confirmed'),
  (prj_id, 'frontend', '/orders/:id', 'GET', 'Order Detail', 'Single order view with timeline', 'inferred'),
  (prj_id, 'frontend', '/reports', 'GET', 'Reports', 'Report generation and download', 'inferred'),
  (prj_id, 'frontend', '/users', 'GET', 'User Management', 'User CRUD with role assignment', 'confirmed'),
  (prj_id, 'frontend', '/settings', 'GET', 'Settings', 'Application configuration', 'confirmed');

  -- Schemas (6)
  INSERT INTO schema_registry (project_id, entity_name, table_name, description, confidence_status) VALUES
  (prj_id, 'User', 'users', 'User accounts with roles and permissions', 'confirmed'),
  (prj_id, 'Product', 'products', 'Product catalog with SKU, price, inventory', 'confirmed'),
  (prj_id, 'Order', 'orders', 'Customer orders with status tracking', 'confirmed'),
  (prj_id, 'OrderItem', 'order_items', 'Line items within an order', 'confirmed'),
  (prj_id, 'Payment', 'payments', 'Payment transactions via Stripe/PayPal', 'confirmed'),
  (prj_id, 'AuditLog', 'audit_logs', 'System audit trail for compliance', 'inferred');

  -- UI Screens (6)
  INSERT INTO ui_registry (project_id, screen_name, route_path, description, state_type, confidence_status) VALUES
  (prj_id, 'Login', '/login', 'Username/password authentication form', 'form', 'confirmed'),
  (prj_id, 'Dashboard', '/dashboard', 'KPI cards, revenue chart, recent orders', 'dashboard', 'confirmed'),
  (prj_id, 'Product List', '/products', 'Searchable product table with pagination', 'table', 'confirmed'),
  (prj_id, 'Order Detail', '/orders/:id', 'Order info, items, payment status, timeline', 'detail_view', 'confirmed'),
  (prj_id, 'Create Product', '/products/new', 'Product creation form with validation', 'form', 'inferred'),
  (prj_id, 'User Management', '/users', 'User table with role assignment modal', 'table', 'confirmed');

  -- Backlog items (5)
  INSERT INTO backlog_items (project_id, source_type, title, description, backlog_type, priority, status, approved_for_task) VALUES
  (prj_id, 'discovery', 'SQL Injection in search endpoint', 'The /api/products?search= endpoint concatenates user input directly into SQL query without parameterization', 'bug', 'critical', 'open', false),
  (prj_id, 'discovery', 'No rate limiting on login', 'POST /api/auth/login has no throttling — vulnerable to brute force attacks', 'bug', 'high', 'open', false),
  (prj_id, 'discovery', 'Missing error handling in payment flow', 'Payment service catches errors silently, no logging, customer sees generic 500', 'bug', 'high', 'open', false),
  (prj_id, 'audit', 'Migrate from PHP to Node.js', 'Legacy PHP codebase should be modernized to Node.js/TypeScript for maintainability', 'improvement', 'medium', 'open', false),
  (prj_id, 'discovery', 'Add API documentation', 'No Swagger or OpenAPI spec exists for the 47 endpoints', 'gap', 'medium', 'open', false);

  -- Notifications
  INSERT INTO notifications (workspace_id, user_id, type, title, message, status) VALUES
  (ws_id, usr_id, 'pipeline_completed', 'Discovery completed: Legacy ERP', 'Pipeline completed: 8 modules, 10 APIs, 6 schemas discovered', 'active'),
  (ws_id, usr_id, 'backlog_created', 'Critical bug found: SQL Injection', 'SQL Injection vulnerability detected in /api/products?search=', 'active');

END $$;
