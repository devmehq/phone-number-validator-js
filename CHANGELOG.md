# Changelog

## v1.6.0 (Unreleased)
### Features
- Add serverless architecture support with lazy resource loading
- Add lint-staged for automated code quality checks on commit
- Add comprehensive serverless test suite with 50+ new test cases
- Add support for concurrent resource loading
- Add locale fallback mechanism for international support

### Improvements  
- Enhanced error handling and recovery for resource loading failures
- Improved cache management with LRU eviction strategy
- Added performance monitoring for resource loading latency
- Extended test coverage for edge cases and validation
- Optimized memory usage in serverless environments

### Development
- Integrated lint-staged with Husky for pre-commit hooks
- Added Biome formatting and linting to staged files
- Improved CI/CD pipeline with semantic-release integration

## v1.5.0
### Features
- Add high-performance LRU caching using tiny-lru library
- Add cache management API: `clearCache()`, `getCacheSize()`, `setCacheSize()`
- Add comprehensive input validation and error handling
- Improve TypeScript type safety with explicit return types

### Improvements
- Refactor code to eliminate duplication between geocoder and carrier functions
- Optimize memory usage with configurable cache limits
- Add 27 new comprehensive test cases
- Enhance error logging in development mode
- Performance improvements: <1ms lookups after initial cache

### Documentation
- Add comprehensive API documentation
- Add performance and memory management guides
- Update README with cache management examples

## v1.3.0
- Update dependencies

## v1.2.15
- Update dependencies

## v1.2.14
- Update dependencies

## v1.2.13
- Update dependencies
- Refactor tests

## v1.2.12
- Update dependencies

## v1.2.11
- Update license from MIT to BSL-1.1
- Update dependencies

## v1.2.10
- Update dependencies

## v1.2.9
- Update readme and tests

## v1.2.8
- Update dependencies
- Release to npm

## v1.3.3
- Update dependencies

## v1.3.4
- Update package.json

## v1.3.5
- Fix version
