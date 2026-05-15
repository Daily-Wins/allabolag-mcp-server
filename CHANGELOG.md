# Changelog

All notable changes to the Allabolag MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-01

### Added
- Initial release of Allabolag MCP Server
- `search_company` tool - Search for companies by name or organization number
- `get_company_details` tool - Get detailed company information
- `get_company_financials` tool - Get financial data and key figures
- `get_company_officials` tool - Get board members and officials
- `get_company_events` tool - Get company events and history
- `get_company_owners` tool - Get ownership information
- Comprehensive documentation (README, INSTALL, EXAMPLES, QUICKSTART)
- TypeScript support with full type definitions
- Modular architecture with scrapers and utils
- Error handling and fallback selectors for robust scraping
- Support for multiple HTML structures on allabolag.se

### Technical Details
- Built with @modelcontextprotocol/sdk v0.5.0
- Uses cheerio for HTML parsing
- Uses node-fetch for HTTP requests
- TypeScript 5.3+ with strict mode enabled
- Stdio transport for MCP communication

## [Unreleased]

### Planned Features
- Caching to reduce API calls
- Rate limiting configuration
- Support for batch operations
- Export functionality (CSV, JSON)
- More detailed financial analysis
- Historical data tracking
- Company comparison tools
- Industry statistics aggregation

### Known Issues
- Some pages on allabolag.se may have different HTML structures
- Rate limiting may occur with many consecutive requests
- Some features may require login on allabolag.se (not yet implemented)

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: See README.md, INSTALL.md, EXAMPLES.md
