# Auto-Population Feature for JSON-RPC Playground

## Overview

The JSON-RPC Playground now includes intelligent auto-population for the `starknet_estimateFee` method. When users select transaction types, the system automatically fills in implied fields like `type` and `version` to streamline the user experience.

## How It Works

### Transaction Type Detection

When working with the `starknet_estimateFee` method, the system detects when a user selects a transaction type from the oneOf schema and automatically populates:

- **Type field**: Set to the appropriate transaction type (`INVOKE`, `DECLARE`, `DEPLOY_ACCOUNT`)
- **Version field**: Set to the corresponding version (`0x3`, `0x1`, `0x2`)

### Transaction Type Mapping

The system uses the following mapping based on the OpenRPC schema order:

| Branch Index | Transaction Type | Version |
|--------------|------------------|---------|
| 0            | INVOKE           | 0x3     |
| 1            | DECLARE          | 0x3     |
| 2            | DEPLOY_ACCOUNT   | 0x3     |
| 3            | INVOKE           | 0x1     |
| 4            | DECLARE          | 0x2     |
| 5            | DEPLOY_ACCOUNT   | 0x1     |

## Visual Indicators

### Auto-Population Badge

Fields that are automatically populated display a blue "auto" badge with a tooltip explaining the behavior:

- **Badge**: Small blue badge labeled "auto"
- **Tooltip**: "This field is automatically populated based on the transaction type selection."
- **Styling**: Auto-populated fields have a subtle blue tint background

### Information Panel

When the `starknet_estimateFee` method is selected, an informational panel appears at the top of the form explaining that auto-population is active.

## Implementation Details

### Key Components Modified

1. **JsonRpc Page (`explorer/src/modules/JsonRpc/page.tsx`)**:
   - Added `autoPopulateImpliedFields` function
   - Enhanced `onParamChange` to trigger auto-population
   - Added initialization logic for estimate fee forms
   - Added informational UI panel

2. **Form Component (`explorer/src/shared/components/form.tsx`)**:
   - Added visual indicators for auto-populated fields
   - Enhanced `JsonSchemaForm` with className support
   - Added tooltips for auto-populated fields

### Auto-Population Logic

```typescript
const autoPopulateImpliedFields = useCallback(
  (paramName: string, value: any, allInputs: any[]) => {
    if (!selected || selected.name !== "starknet_estimateFee") return allInputs;

    if (paramName === "request" && value && typeof value === "object") {
      // Process array of transactions
      if (Array.isArray(value)) {
        const updatedTransactions = value.map((tx) => {
          if (tx && typeof tx === "object" && tx.__oneOfSelected__ !== undefined) {
            const { type, version } = getTransactionTypeAndVersion(tx.__oneOfSelected__);
            
            // Auto-populate type and version if not already set
            const txValue = { ...tx.__oneOfValue__ };
            if (!txValue.type || txValue.type === "") txValue.type = type;
            if (!txValue.version || txValue.version === "") txValue.version = version;
            
            return { ...tx, __oneOfValue__: txValue };
          }
          return tx;
        });
        
        allInputs[0] = updatedTransactions;
      }
    }

    return allInputs;
  },
  [selected],
);
```

## Benefits

1. **Reduced User Error**: Eliminates the need to manually specify obvious fields
2. **Improved UX**: Faster form completion with fewer required inputs
3. **Clear Feedback**: Visual indicators show which fields are auto-managed
4. **Non-Intrusive**: Users can still override auto-populated values if needed

## Future Enhancements

- Extend auto-population to other RPC methods that have implied relationships
- Add user preference to enable/disable auto-population
- Implement smart defaults based on common usage patterns
- Add validation to ensure auto-populated values are valid for the selected schema