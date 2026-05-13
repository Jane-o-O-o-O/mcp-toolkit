[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@mcp-toolkit/core](../README.md) / BaseConfigFields

# Variable: BaseConfigFields

> `const` **BaseConfigFields**: `object`

Defined in: [config.ts:11](https://github.com/Jane-o-O-o-O/mcp-toolkit/blob/2e8380e400ee94aeeaadf820776ca4eef7cca609/shared/core/src/config.ts#L11)

Zod schema for common config fields

## Type Declaration

### logLevel

> **logLevel**: `ZodDefault`\<`ZodEnum`\<\[`"debug"`, `"info"`, `"warn"`, `"error"`\]\>\>

### port

> **port**: `ZodDefault`\<`ZodNumber`\>

### transport

> **transport**: `ZodDefault`\<`ZodEnum`\<\[`"stdio"`, `"sse"`, `"streamable-http"`\]\>\>
