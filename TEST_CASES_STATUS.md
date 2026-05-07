# Test Cases: Description → Path → Status

This document maps each required functionality to the automated Jest test that covers it.

## Suite location
- **Test file**: `artifacts/collector/tests/requirements.test.ts`
- **Runner script**: `scripts/run-local-tests.sh`
- **Run command**: `./scripts/run-local-tests.sh`

## Overall status

```text
Last known run: PASS
Test suites: 1 passed, 1 total
Tests: 14 passed, 14 total
Command: (repo root) ./scripts/run-local-tests.sh
```

---

## 1) Auth Register/Login + Role Routing (US-01, US-02, US-03)
- **Description**: Validates basic signup validation and that each role routes to the correct “home”.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #1)

```text
Status: PASS
```

## 2) Collector Approval Gate (US-05, US-21)
- **Description**: Pending collector cannot accept jobs; approved collector can accept.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #2)

```text
Status: PASS
```

## 3) Household Create Pickup (type + weight + location) (US-06, US-07, US-33)
- **Description**: Pickup creation requires valid weight and attaches location data.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #3)

```text
Status: PASS
```

## 4) Collector Nearby Jobs Map + Hotspots (US-13, US-34)
- **Description**: Lists pending pickups within radius and computes hotspot buckets.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #4)

```text
Status: PASS
```

## 5) Collector Accept Job → Household Notified (US-14, US-09)
- **Description**: Accepting a job updates pickup status and emits a household notification event.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #5)

```text
Status: PASS
```

## 6) Collector Navigation + Route Fallback (US-15, US-35)
- **Description**: With a valid maps key, route includes an intermediate polyline point; without key, fallback route still returns distance/ETA.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #6)

```text
Status: PASS
```

## 7) Live Tracking Household View (US-08, US-37)
- **Description**: Household can read collector’s updated live location values.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #7)

```text
Status: PASS
```

## 8) Weight Entry + Complete Pickup + Receipt (US-16, US-17, US-10)
- **Description**: Completing a pickup records actual weight, closes the pickup, and generates a receipt.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #8)

```text
Status: PASS
```

## 9) Points Auto-Credit + Balance + Breakdown (US-27, US-28, US-30)
- **Description**: Points credit happens only after completion and appears in balance/breakdown.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #9)

```text
Status: PASS
```

## 10) Redeem Points for Top-up (US-29)
- **Description**: Redeeming points reduces balance and records a redemption transaction entry.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #10)

```text
Status: PASS
```

## 11) Admin Ops: Suspend Collector + Effect (US-26)
- **Description**: Suspended collector cannot accept jobs.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #11)

```text
Status: PASS
```

## 12) Admin Impact Dashboard + Active Collectors Map (US-20, US-22)
- **Description**: Smoke-checks that dashboard inputs can be derived (receipts/ledger) and active collectors have a last-known live location.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #12)

```text
Status: PASS
```

## 13) Non-Functional: Security & Privacy
- **Description**:\n+  - JWT expiry is exactly **24 hours**.\n+  - Privacy requirement: **pickup location is hidden/deleted after completion**.- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #13)
- **Related implementation hook**: `artifacts/collector/lib/domain/logic.ts` (completion sets `pickup.location = null`)
```text
Status: PASS
```

##  14) Non-Functional: Performance Smoke
-**Description**: Bulk create (500 pickups) completes under a loose time bound to catch accidental performance regressions.
- **Path**: `artifacts/collector/tests/requirements.test.ts` (Test #14)
```text
Status: PASS
```
