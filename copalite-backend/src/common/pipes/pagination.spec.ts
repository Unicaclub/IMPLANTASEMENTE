import { getPaginationSkipTake, PaginatedResponseDto } from './pagination';

describe('pagination helpers', () => {
  it('should compute skip/take correctly', () => {
    const result = getPaginationSkipTake({ page: 3, limit: 10, sortBy: 'createdAt', sortOrder: 'DESC' });
    expect(result).toEqual({ skip: 20, take: 10 });
  });

  it('should build response meta', () => {
    const response = new PaginatedResponseDto([{ id: 1 }], 25, 2, 10);

    expect(response.data).toHaveLength(1);
    expect(response.meta.total).toBe(25);
    expect(response.meta.page).toBe(2);
    expect(response.meta.limit).toBe(10);
    expect(response.meta.totalPages).toBe(3);
    expect(response.meta.hasNextPage).toBe(true);
    expect(response.meta.hasPreviousPage).toBe(true);
  });
});
