# Blockchain Tampering Analysis & Resolution Guide

## Issue Summary
**Tampering detected at block #9** - The blockchain integrity verification has detected that block #9 has been modified or corrupted, breaking the chain of cryptographic hashes.

### Affected Block Details
- **Block Index**: 9
- **Transaction Type**: `exam.start` (exam_submission)
- **Timestamp**: 11/11/2025 12:45:41
- **Hash**: `5be6975d1f2a...` (truncated)

---

## Root Cause Analysis

### How Blockchain Verification Works

The system uses SHA-256 cryptographic hashing to ensure data integrity:

```
Block Structure:
{
  index: number,
  prevHash: string (hash of previous block),
  data: AuditData,
  timestamp: number,
  hash: string (SHA-256 of all above)
}

Hash Computation:
hash = SHA256(JSON.stringify({ index, prevHash, data, timestamp }))
```

### Why Block #9 Failed Verification

The verification process checks:

1. **Hash Integrity**: Recomputes the block's hash and compares with stored hash
   - If data was modified → hash won't match
   - If timestamp was changed → hash won't match
   - If any field was altered → hash won't match

2. **Chain Linking**: Verifies `prevHash` points to previous block's hash
   - Block #9's `prevHash` should equal Block #8's `hash`
   - If broken → chain is broken

3. **Sequential Integrity**: Ensures blocks are in order
   - Genesis block (index 0) must have `prevHash = 'GENESIS'`
   - All subsequent blocks must link properly

### Possible Causes of Tampering

1. **Database Direct Modification**
   - Someone directly edited the `AuditBlock` table in PostgreSQL
   - Changed `data`, `timestamp`, or `hash` fields
   - This breaks the cryptographic chain

2. **Timestamp Modification**
   - The `timestamp` field was changed after block creation
   - Since timestamp is part of hash computation, this invalidates the hash

3. **Data Corruption**
   - The `data` JSON field was modified
   - Example: Changed `examId`, `studentId`, or `payload`

4. **Hash Recalculation Error**
   - The hash was manually changed without updating the data
   - Or vice versa

5. **Concurrent Write Issues**
   - Race condition during block creation
   - Block saved with incorrect hash

---

## How to Diagnose the Exact Problem

### Step 1: Query Block #9 Directly

```sql
SELECT * FROM "AuditBlock" WHERE index = 9;
```

This will show:
- Current stored hash
- Current data
- Current timestamp
- Previous hash

### Step 2: Manually Verify the Hash

```javascript
const crypto = require('crypto');

// Get block #9 data from database
const block = {
  index: 9,
  prevHash: "...", // from database
  data: {...},     // from database
  timestamp: ...   // from database
};

// Recompute hash
const raw = JSON.stringify({ 
  index: block.index, 
  prevHash: block.prevHash, 
  data: block.data, 
  timestamp: block.timestamp 
});
const computedHash = crypto.createHash('sha256').update(raw).digest('hex');

// Compare
console.log('Stored Hash:', block.hash);
console.log('Computed Hash:', computedHash);
console.log('Match:', block.hash === computedHash);
```

### Step 3: Check Block #8 (Previous Block)

```sql
SELECT * FROM "AuditBlock" WHERE index = 8;
```

Verify that Block #9's `prevHash` equals Block #8's `hash`.

---

## Resolution Strategies

### Option 1: Restore from Backup (Recommended)

**If you have a database backup from before the tampering:**

1. Restore the database from the backup
2. Verify the blockchain again
3. Implement monitoring to detect future tampering

**Pros**: Guaranteed to restore integrity
**Cons**: May lose recent legitimate transactions

### Option 2: Rebuild the Blockchain from Block #9 Onwards

**If you want to keep all data but fix the chain:**

1. **Identify the root cause** of block #9's corruption
2. **Fix block #9**:
   ```sql
   -- Get block #8's hash
   SELECT hash FROM "AuditBlock" WHERE index = 8;
   
   -- Update block #9's prevHash if needed
   UPDATE "AuditBlock" 
   SET prevHash = '<block_8_hash>'
   WHERE index = 9;
   ```

3. **Recalculate block #9's hash**:
   ```javascript
   // Use the blockchain.ts computeHash function
   const newHash = computeHash(9, prevHash, data, timestamp);
   ```

4. **Update the hash in database**:
   ```sql
   UPDATE "AuditBlock" 
   SET hash = '<new_hash>'
   WHERE index = 9;
   ```

5. **Rebuild all subsequent blocks** (10, 11, 12, ...):
   - Each block's `prevHash` must point to the previous block's new hash
   - Recalculate each block's hash
   - Update all blocks in sequence

**Pros**: Keeps all data
**Cons**: Complex, error-prone, requires careful execution

### Option 3: Invalidate and Restart Blockchain

**If the tampering is severe or you can't identify the cause:**

1. **Backup current data** for investigation
2. **Delete all audit blocks**:
   ```sql
   DELETE FROM "AuditBlock";
   ```

3. **Restart blockchain** - next operation will create genesis block
4. **Re-audit critical operations** if needed

**Pros**: Clean slate, guaranteed integrity going forward
**Cons**: Loses all audit history

---

## Recommended Fix for Your Situation

Based on the data you provided (exam.start transaction on 11/11/2025):

### Step 1: Investigate Block #9

```sql
SELECT 
  index,
  prevHash,
  data,
  timestamp,
  hash
FROM "AuditBlock" 
WHERE index IN (8, 9, 10)
ORDER BY index;
```

### Step 2: Check if Data is Correct

The block contains:
- `action`: "exam.start"
- `entity`: "exam_submission"
- `entityId`: "cmhui8rqi000..." (submission ID)
- `payload`: Contains exam details

**Verify**: Does this transaction actually exist in the database?
```sql
SELECT * FROM "ExamSubmission" WHERE id = 'cmhui8rqi000...';
```

### Step 3: Determine Root Cause

- **If data is correct but hash is wrong**: Recalculate hash (Option 2)
- **If data is corrupted**: Restore from backup (Option 1)
- **If you can't determine**: Restart blockchain (Option 3)

---

## Prevention: Avoid Future Tampering

### 1. **Database Access Control**
```sql
-- Restrict direct access to AuditBlock table
REVOKE ALL ON "AuditBlock" FROM public;
GRANT SELECT ON "AuditBlock" TO app_user;
-- Only app can write, not direct SQL
```

### 2. **Add Audit Logging**
- Log all database modifications
- Monitor for direct table edits
- Alert on suspicious changes

### 3. **Implement Blockchain Verification Cron Job**
```typescript
// Run every hour
setInterval(async () => {
  const result = await verifyChain();
  if (!result.ok) {
    // Alert admin
    console.error(`Blockchain tampering detected at block #${result.at}`);
    // Send email/notification
  }
}, 60 * 60 * 1000);
```

### 4. **Use Immutable Database Features**
- PostgreSQL: Use `UNLOGGED` tables or WAL archiving
- Consider blockchain-as-a-service (AWS QLDB, etc.)

### 5. **Add Cryptographic Signatures**
```typescript
// Sign each block with admin private key
import crypto from 'crypto';

function signBlock(block: Block, privateKey: string): string {
  const sign = crypto.createSign('sha256');
  sign.update(JSON.stringify(block));
  return sign.sign(privateKey, 'hex');
}

function verifyBlockSignature(block: Block, signature: string, publicKey: string): boolean {
  const verify = crypto.createVerify('sha256');
  verify.update(JSON.stringify(block));
  return verify.verify(publicKey, signature, 'hex');
}
```

### 6. **Implement Merkle Tree**
- Store hash of all blocks in a Merkle tree
- Makes tampering detection even more robust
- Can identify exactly which blocks were modified

---

## Implementation: Fix Block #9

### Quick Fix (if data is correct):

1. **Create a migration script**:

```typescript
// server/fix-blockchain.ts
import { prisma } from './src/infrastructure/prisma/client';
import crypto from 'crypto';

async function fixBlockchain() {
  // Get blocks 8, 9, 10
  const blocks = await prisma.auditBlock.findMany({
    where: { index: { in: [8, 9, 10] } },
    orderBy: { index: 'asc' }
  });

  if (blocks.length < 2) {
    console.error('Not enough blocks to fix');
    return;
  }

  // Verify block 8 is correct
  const block8 = blocks[0];
  const expectedHash8 = computeHash(
    block8.index,
    block8.prevHash,
    block8.data as any,
    new Date(block8.timestamp).getTime()
  );

  if (expectedHash8 !== block8.hash) {
    console.error('Block 8 is also corrupted. Restore from backup.');
    return;
  }

  // Fix block 9
  const block9 = blocks[1];
  const newHash9 = computeHash(
    block9.index,
    block8.hash, // Use block 8's hash as prevHash
    block9.data as any,
    new Date(block9.timestamp).getTime()
  );

  await prisma.auditBlock.update({
    where: { id: block9.id },
    data: {
      prevHash: block8.hash,
      hash: newHash9
    }
  });

  console.log('Block 9 fixed');

  // Fix block 10 if it exists
  if (blocks.length > 2) {
    const block10 = blocks[2];
    const newHash10 = computeHash(
      block10.index,
      newHash9, // Use new hash 9
      block10.data as any,
      new Date(block10.timestamp).getTime()
    );

    await prisma.auditBlock.update({
      where: { id: block10.id },
      data: {
        prevHash: newHash9,
        hash: newHash10
      }
    });

    console.log('Block 10 fixed');
  }

  // Verify chain
  const result = await verifyChain();
  console.log('Chain verification:', result);
}

function computeHash(index: number, prevHash: string, data: any, timestamp: number) {
  const raw = JSON.stringify({ index, prevHash, data, timestamp });
  return crypto.createHash('sha256').update(raw).digest('hex');
}

fixBlockchain().catch(console.error);
```

2. **Run the fix**:
```bash
cd server
npx ts-node fix-blockchain.ts
```

3. **Verify**:
```bash
# Check blockchain status
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/audit/verify
```

---

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Block #9 hash mismatch | Data modified or timestamp changed | Recalculate hash or restore from backup |
| Chain link broken | prevHash doesn't match previous block | Update prevHash to correct value |
| Multiple blocks corrupted | Systemic issue | Restore from backup or restart blockchain |

**Recommended Action**: 
1. Investigate block #9 data integrity
2. If data is correct: Run the fix script above
3. If data is corrupted: Restore from backup
4. Implement monitoring to prevent future tampering

---

## Testing the Fix

After applying the fix:

```bash
# 1. Verify blockchain
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/audit/verify

# 2. Check block #9 specifically
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/audit/blocks/9

# 3. Check stats
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/audit/stats
```

All should show `chainStatus: "verified"` and no tampering detected.
