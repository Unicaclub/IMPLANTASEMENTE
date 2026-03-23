import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditEntity } from '../audits/entities/audit.entity';
import { ReportEntity } from '../reports/entities/report.entity';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { BacklogType, BacklogPriority, BacklogStatus, StatusBase } from '../../common/enums';

export interface AuditFinding {
  title: string;
  severity: string;
  category: string;
  description: string;
  recommendation: string;
}

@Injectable()
export class PipelineHandlerService {
  private readonly logger = new Logger(PipelineHandlerService.name);

  /**
   * Audit Pipeline: Analyze registries, generate findings, create audit + report.
   */
  async executeAuditPipeline(
    projectId: string,
    runId: string,
    auditRepo: Repository<AuditEntity>,
    reportRepo: Repository<ReportEntity>,
    moduleRepo: Repository<ModuleRegistryEntity>,
    apiRepo: Repository<ApiRegistryEntity>,
  ): Promise<{ auditId: string; reportId: string; findingsCount: number }> {
    this.logger.log(`Starting audit pipeline for project ${projectId}`);

    // Analyze registries for gaps
    const modules = await moduleRepo.find({ where: { projectId } });
    const apis = await apiRepo.find({ where: { projectId } });

    const findings: AuditFinding[] = [];

    // Check modules without descriptions
    for (const mod of modules) {
      if (!mod.description || mod.description.length < 10) {
        findings.push({
          title: `Module "${mod.name}" lacks description`,
          severity: 'medium',
          category: 'completeness',
          description: `Module ${mod.name} has insufficient documentation`,
          recommendation: 'Add a detailed description to this module',
        });
      }
    }

    // Check APIs without proper documentation
    for (const api of apis) {
      if (!api.description || api.description.length < 10) {
        findings.push({
          title: `API endpoint "${api.path}" lacks description`,
          severity: 'medium',
          category: 'completeness',
          description: `API ${api.httpMethod} ${api.path} has insufficient documentation`,
          recommendation: 'Document the API endpoint with parameters, responses, and usage',
        });
      }
    }

    // Coverage check
    if (modules.length === 0) {
      findings.push({
        title: 'No modules registered',
        severity: 'high',
        category: 'completeness',
        description: 'The project has no modules in the registry. Run a discovery first.',
        recommendation: 'Execute a discovery pipeline to populate the module registry',
      });
    }

    if (apis.length === 0) {
      findings.push({
        title: 'No API endpoints registered',
        severity: 'high',
        category: 'completeness',
        description: 'The project has no API endpoints in the registry.',
        recommendation: 'Execute a discovery pipeline to populate the API registry',
      });
    }

    // Create audit record
    const audit = auditRepo.create({
      projectId,
      runId,
      title: `Automated Audit — ${new Date().toISOString().split('T')[0]}`,
      auditType: 'completeness',
      scopeText: `Analyzed ${modules.length} modules and ${apis.length} APIs`,
      summary: `Found ${findings.length} issues across ${modules.length} modules and ${apis.length} APIs`,
      resultStatus: findings.length === 0 ? 'pass' : findings.some(f => f.severity === 'critical') ? 'fail' : 'partial',
    });
    const savedAudit = await auditRepo.save(audit);

    // Generate report
    const reportContent = this.generateAuditReport(findings, modules.length, apis.length);
    const report = reportRepo.create({
      projectId,
      runId,
      reportType: 'audit',
      title: `Audit Report — ${new Date().toISOString().split('T')[0]}`,
      summary: `Audit found ${findings.length} issues`,
      contentMarkdown: reportContent,
      status: StatusBase.ACTIVE,
    });
    const savedReport = await reportRepo.save(report);

    this.logger.log(`Audit complete: ${findings.length} findings, audit=${savedAudit.id}, report=${savedReport.id}`);

    return {
      auditId: savedAudit.id,
      reportId: savedReport.id,
      findingsCount: findings.length,
    };
  }

  /**
   * Backlog Generation Pipeline: Analyze audit findings and diffs,
   * generate backlog items (all with approvedForTask = false).
   */
  async executeBacklogGeneration(
    projectId: string,
    runId: string,
    auditRepo: Repository<AuditEntity>,
    backlogRepo: Repository<BacklogItemEntity>,
  ): Promise<{ itemsGenerated: number }> {
    this.logger.log(`Starting backlog generation for project ${projectId}`);

    // Get existing audits for this project
    const audits = await auditRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const items: Partial<BacklogItemEntity>[] = [];

    // Generate items from audit summaries
    for (const audit of audits) {
      if (audit.resultStatus !== 'pass') {
        items.push({
          projectId,
          runId,
          sourceType: 'audit',
          sourceRef: audit.id,
          title: `Address audit finding: ${audit.title}`,
          description: `Audit "${audit.title}" found issues: ${audit.summary}. Scope: ${audit.scopeText || 'full project'}`,
          backlogType: BacklogType.IMPROVEMENT,
          priority: audit.resultStatus === 'fail' ? BacklogPriority.HIGH : BacklogPriority.MEDIUM,
          status: BacklogStatus.OPEN,
          approvedForTask: false,
          evidenceCount: 0,
        });
      }
    }

    // If no audits, generate a baseline item
    if (items.length === 0) {
      items.push({
        projectId,
        runId,
        sourceType: 'audit',
        title: 'Run initial audit',
        description: 'No previous audit findings found. Run an audit pipeline first to generate findings.',
        backlogType: BacklogType.VALIDATION,
        priority: BacklogPriority.MEDIUM,
        status: BacklogStatus.OPEN,
        approvedForTask: false,
        evidenceCount: 0,
      });
    }

    // Save all items
    let savedCount = 0;
    for (const item of items) {
      try {
        await backlogRepo.save(backlogRepo.create(item));
        savedCount++;
      } catch (err) {
        this.logger.warn(`Failed to save backlog item: ${err}`);
      }
    }

    this.logger.log(`Backlog generation complete: Generated ${savedCount} items, all pending approval`);

    return { itemsGenerated: savedCount };
  }

  private generateAuditReport(findings: AuditFinding[], moduleCount: number, apiCount: number): string {
    const lines = [
      '# Audit Report',
      '',
      `**Date:** ${new Date().toISOString().split('T')[0]}`,
      `**Modules analyzed:** ${moduleCount}`,
      `**APIs analyzed:** ${apiCount}`,
      `**Findings:** ${findings.length}`,
      '',
      '## Summary',
      '',
      findings.length === 0
        ? 'No issues found. All registries appear complete.'
        : `Found ${findings.length} issues that need attention.`,
      '',
    ];

    if (findings.length > 0) {
      lines.push('## Findings', '');

      const grouped: Record<string, AuditFinding[]> = {};
      for (const f of findings) {
        if (!grouped[f.severity]) grouped[f.severity] = [];
        grouped[f.severity].push(f);
      }

      for (const severity of ['critical', 'high', 'medium', 'low']) {
        const group = grouped[severity];
        if (!group) continue;
        lines.push(`### ${severity.toUpperCase()} (${group.length})`, '');
        for (const f of group) {
          lines.push(`- **${f.title}** (${f.category})`);
          lines.push(`  ${f.description}`);
          lines.push(`  *Recommendation:* ${f.recommendation}`);
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }
}
