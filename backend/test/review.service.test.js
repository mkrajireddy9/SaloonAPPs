const test = require('node:test');
const assert = require('node:assert/strict');
const { ReviewService } = require('../dist/reviews/review.service.js');

test('review creation persists the numeric rating and trimmed comment', async () => {
  const saved = [];
  const repo = {
    findOne: async () => null,
    create: value => value,
    save: async value => { saved.push(value); return { id: 'review-1', ...value }; },
  };
  const service = new ReviewService(repo);
  const result = await service.create({ rating: 4, comment: '  Great service  ' }, { email: 'guest@example.com', name: 'Guest' });
  assert.equal(result.rating, 4);
  assert.equal(result.comment, 'Great service');
  assert.equal(saved[0].status, 'Pending');
});
