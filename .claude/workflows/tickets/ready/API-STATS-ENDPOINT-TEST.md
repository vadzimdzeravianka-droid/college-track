# Ticket: College Statistics API Endpoint

**Status**: READY
**Priority**: MEDIUM
**Estimated Tokens**: 18K
**Groomed Requirement**: test-evaluation

## Summary

Create `/api/stats/colleges` GET endpoint that returns aggregated statistics about colleges (total count, breakdown by category, status distribution). This will power a future dashboard statistics widget.

## Implementation Approach

Create Next.js App Router API route. Use Prisma for database aggregation. Follow existing patterns in `app/api/` directory.

## Affected Files

### To Create
- `app/api/stats/colleges/route.ts` - API route handler
- `app/api/stats/colleges/__tests__/route.test.ts` - Integration tests

## Subtasks

### Subtask 1: Implement Stats API Endpoint
**Complexity**: Medium
**Estimated Tokens**: 18K

**Description**: Create GET endpoint that returns college statistics using Prisma aggregation queries.

**API Contract**:
```typescript
GET /api/stats/colleges

Response (200 OK):
{
  "total": 15,
  "byCategory": {
    "REACH": 5,
    "MATCH": 7,
    "SAFETY": 3
  },
  "byStatus": {
    "NOT_STARTED": 4,
    "IN_PROGRESS": 6,
    "SUBMITTED": 3,
    "ACCEPTED": 2
  },
  "timestamp": "2026-03-28T10:00:00.000Z"
}

Response (500 Internal Server Error):
{
  "error": "Failed to fetch statistics",
  "details": "Error message"
}
```

**Implementation Details**:
- Use `prisma.college.groupBy()` for aggregations
- Handle database errors gracefully
- Return JSON with proper Content-Type header
- Add timestamp for cache invalidation
- Only count non-deleted colleges (if soft delete exists)

**Tests**:
- Unit: Returns correct total count
- Unit: Groups colleges by category correctly
- Unit: Groups colleges by status correctly
- Unit: Returns 200 status code on success
- Unit: Returns JSON Content-Type header
- Unit: Includes timestamp in response
- Integration: Returns 500 on database error
- Integration: Response matches JSON schema
- Edge case: Returns zeros when no colleges exist
- Edge case: Handles missing category/status gracefully

**Acceptance**:
- [ ] GET endpoint exists at /api/stats/colleges
- [ ] Returns correct total college count
- [ ] byCategory contains REACH, MATCH, SAFETY counts
- [ ] byStatus contains all status type counts
- [ ] Response includes timestamp field
- [ ] Returns 500 status code on database errors
- [ ] Response has correct Content-Type: application/json
- [ ] All tests pass
- [ ] Test coverage >= 90%
- [ ] No linter errors
- [ ] TypeScript types are correct
- [ ] Error handling covers database failures
