[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@mcp-toolkit/core](../README.md) / safeRun

# Function: safeRun()

> **safeRun**\<`T`\>(`fn`, `format?`): `Promise`\<[`ToolResult`](../interfaces/ToolResult.md)\>

Defined in: [tools.ts:40](https://github.com/Jane-o-O-o-O/mcp-toolkit/blob/2e8380e400ee94aeeaadf820776ca4eef7cca609/shared/core/src/tools.ts#L40)

Wrap an async operation with standardized error handling

## Type Parameters

### T

`T`

## Parameters

### fn

() => `Promise`\<`T`\>

### format?

(`result`) => `string`

## Returns

`Promise`\<[`ToolResult`](../interfaces/ToolResult.md)\>
