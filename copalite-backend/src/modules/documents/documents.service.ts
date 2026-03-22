import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './entities/document.entity';
import { DocumentVersionEntity } from './entities/document-version.entity';
import { CreateDocumentDto, UpdateDocumentDto, CreateDocumentVersionDto } from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    @InjectRepository(DocumentVersionEntity)
    private readonly versionRepo: Repository<DocumentVersionEntity>,
  ) {}

  async create(dto: CreateDocumentDto, userId?: string): Promise<DocumentEntity> {
    const slugExists = await this.docRepo.findOne({
      where: { projectId: dto.projectId, slug: dto.slug },
    });
    if (slugExists) throw new ConflictException('Document slug already exists in this project');

    const doc = this.docRepo.create({ ...dto, createdByUserId: userId || null });
    return this.docRepo.save(doc);
  }

  async findAllByProject(projectId: string): Promise<DocumentEntity[]> {
    return this.docRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<DocumentEntity> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentEntity> {
    const doc = await this.findById(id);
    Object.assign(doc, dto);
    return this.docRepo.save(doc);
  }

  async createVersion(documentId: string, dto: CreateDocumentVersionDto, userId?: string): Promise<DocumentVersionEntity> {
    await this.findById(documentId);

    const lastVersion = await this.versionRepo.findOne({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });
    const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

    const version = this.versionRepo.create({
      documentId,
      versionNumber: nextVersion,
      contentMarkdown: dto.contentMarkdown,
      changeSummary: dto.changeSummary || null,
      createdByUserId: userId || null,
    });
    return this.versionRepo.save(version);
  }

  async listVersions(documentId: string): Promise<DocumentVersionEntity[]> {
    return this.versionRepo.find({
      where: { documentId },
      order: { versionNumber: 'DESC' },
    });
  }
}
