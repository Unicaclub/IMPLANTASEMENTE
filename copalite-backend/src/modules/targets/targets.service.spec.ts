import { NotFoundException } from '@nestjs/common';
import { TargetsService } from './targets.service';

// Mock the crypto module before importing anything that uses it
jest.mock('../../common/utils/crypto', () => ({
  encryptCredentials: jest.fn().mockReturnValue('salt64:iv64:tag64:cipher64'),
}));

import { encryptCredentials } from '../../common/utils/crypto';

describe('TargetsService', () => {
  const repo = {
    create: jest.fn().mockImplementation((d) => ({ ...d })),
    save: jest.fn().mockImplementation((e) => ({ id: 't-1', createdAt: new Date(), ...e })),
    find: jest.fn(),
    findOne: jest.fn(),
  } as any;

  const ownership = {
    assertProjectMembership: jest.fn().mockResolvedValue(undefined),
  } as any;

  let service: TargetsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TargetsService(repo, ownership);
  });

  it('should save target with encrypted credentials', async () => {
    const dto = {
      projectId: 'p-1',
      name: 'Staging API',
      baseUrl: 'https://api.staging.example.com',
      authMode: 'bearer',
      credentialsJson: { token: 'secret-abc' },
    } as any;

    const result = await service.create(dto, 'u-1');

    expect(ownership.assertProjectMembership).toHaveBeenCalledWith('p-1', 'u-1');
    expect(encryptCredentials).toHaveBeenCalledWith({ token: 'secret-abc' });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ credentialsJson: { _enc: 'salt64:iv64:tag64:cipher64' } }),
    );
    expect(result.id).toBe('t-1');
  });

  it('should save target without credentials when authMode=none', async () => {
    const dto = {
      projectId: 'p-1',
      name: 'Public API',
      baseUrl: 'https://api.public.example.com',
      authMode: 'none',
    } as any;

    const result = await service.create(dto);

    expect(ownership.assertProjectMembership).not.toHaveBeenCalled();
    expect(encryptCredentials).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Public API' }));
    expect(result.id).toBe('t-1');
  });

  it('should return targets for project with masked credentials', async () => {
    repo.find.mockResolvedValue([
      { id: 't-1', projectId: 'p-1', name: 'Target A', credentialsJson: { _enc: 'encrypted-blob' } },
      { id: 't-2', projectId: 'p-1', name: 'Target B', credentialsJson: null },
    ]);

    const results = await service.findAllByProject('p-1', 'u-1');

    expect(ownership.assertProjectMembership).toHaveBeenCalledWith('p-1', 'u-1');
    expect(results).toHaveLength(2);
    expect(results[0].credentialsJson).toEqual({ _masked: true });
    expect(results[1].credentialsJson).toBeNull();
  });

  it('should return single target with masked credentials', async () => {
    repo.findOne.mockResolvedValue({
      id: 't-1',
      projectId: 'p-1',
      name: 'Target A',
      credentialsJson: { _enc: 'encrypted-blob' },
    });

    const result = await service.findById('t-1');

    expect(result.credentialsJson).toEqual({ _masked: true });
  });

  it('should throw NotFoundException for unknown target', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findById('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update and re-encrypt credentials if changed', async () => {
    // findById is called internally by update
    repo.findOne.mockResolvedValue({
      id: 't-1',
      projectId: 'p-1',
      name: 'Target A',
      credentialsJson: { _enc: 'old-encrypted' },
    });

    const dto = { credentialsJson: { password: 'new-secret' } } as any;

    await service.update('t-1', dto);

    expect(encryptCredentials).toHaveBeenCalledWith({ password: 'new-secret' });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ credentialsJson: { _enc: 'salt64:iv64:tag64:cipher64' } }),
    );
  });
});
