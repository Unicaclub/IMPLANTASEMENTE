/**
 * COPALITE - OpenAPI/Swagger Export Script
 * 
 * Run with: npx ts-node scripts/export-openapi.ts
 * 
 * This generates the OpenAPI 3.0 spec as a JSON file
 * without needing to start the HTTP server.
 */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Copalite API')
    .setDescription(`
Copalite Platform — Backend API v1

## Overview
Copalite is a software discovery, mapping and validation platform that uses 9 specialized AI agents 
to analyze existing codebases and generate structured technical registries.

## Authentication
All endpoints require JWT Bearer token authentication except:
- POST /api/v1/auth/login
- POST /api/v1/users (registration)

## Core Concepts
- **Workspace**: Organization-level container for projects and members
- **Project**: A software system being analyzed
- **Source**: A data source (repo, docs, API spec, etc.) attached to a project
- **Run**: An execution pipeline that coordinates agents
- **Agent**: One of 9 specialized AI agents (orchestrator, architect, db_builder, etc.)
- **Registry**: Structured records of discovered components (modules, routes, APIs, schemas, UI)
- **Evidence**: Proof artifacts that support registry entries
- **Backlog**: Auto-generated issues that require human approval before becoming tasks
- **Task**: Approved work items ready for execution

## Key Business Rules
1. Tasks can only be created from approved backlog items
2. Backlog items need description ≥ 10 chars to be approved
3. Runs are controlled: only discovery, comparison, audit, backlog_generation types
4. Sources do not store sensitive credentials — only reference keys
    `.trim())
    .setVersion('1.0.0')
    .setContact('Copalite Team', '', 'team@copalite.io')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User registration and management')
    .addTag('Workspaces', 'Workspace and member management')
    .addTag('Projects', 'Project management within workspaces')
    .addTag('Sources', 'Data source registration')
    .addTag('Documents', 'Document storage and versioning')
    .addTag('Decisions', 'Technical decision records')
    .addTag('Agents', 'AI agent configuration')
    .addTag('Prompts', 'Versioned prompts per agent')
    .addTag('Runs', 'Execution runs and steps')
    .addTag('Agent Runs', 'Individual agent executions within a run')
    .addTag('Agent Outputs', 'Structured outputs from agent runs')
    .addTag('Orchestration', 'Pipeline execution and coordination')
    .addTag('Dashboard', 'Project metrics and overview')
    .addTag('Modules Registry', 'Discovered software modules')
    .addTag('Route Registry', 'Discovered frontend/backend routes')
    .addTag('API Registry', 'Discovered API endpoints')
    .addTag('Schema Registry', 'Discovered data schemas and fields')
    .addTag('UI Registry', 'Discovered UI screens and actions')
    .addTag('Codebase Map', 'Codebase file and artifact mapping')
    .addTag('Evidence Registry', 'Evidence artifacts supporting discoveries')
    .addTag('Comparisons', 'Cross-source comparisons and diffs')
    .addTag('Backlog', 'Auto-generated backlog with human approval gate')
    .addTag('Tasks', 'Approved work items')
    .addTag('Audits', 'Audit records')
    .addTag('Reports', 'Generated reports')
    .addTag('Logs', 'System logs')
    .addTag('Notifications', 'User notifications')
    .addTag('System Health', 'Health checks')
    .addTag('Activity History', 'Activity tracking')
    .addServer('http://localhost:3000/api/v1', 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Write to file
  const outputPath = './openapi-spec.json';
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI spec exported to ${outputPath}`);
  console.log(`Endpoints: ${Object.keys(document.paths || {}).length} paths`);
  console.log(`Schemas: ${Object.keys(document.components?.schemas || {}).length} schemas`);

  await app.close();
}

exportOpenApi().catch(console.error);
