# Testing Documentation

## Running Tests

- `npm run test`: Run all tests
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:watch`: Run tests in watch mode
- `npm run test:performance`: Run performance tests

## Test Structure

- `src/tests/components/`: Component tests
- `src/tests/performance/`: Performance tests
- `src/tests/test-utils.jsx`: Common testing utilities

## CI/CD Integration

Tests are automatically run on:
- Push to main branch
- Pull request creation/update

Coverage reports are uploaded as artifacts and can be downloaded from the GitHub Actions workflow.

## Best Practices

1. Write tests for new components
2. Maintain test coverage above 80%
3. Run performance tests for critical features
4. Update tests when modifying components
5. Use test utilities for common testing patterns

## Troubleshooting

If tests are failing:
1. Run tests locally to reproduce the issue
2. Check the test logs in GitHub Actions
3. Review recent changes that might have affected the tests
4. Update test snapshots if necessary