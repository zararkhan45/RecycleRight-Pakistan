import type {
  CollectorProfile,
  PointsLedgerEntry,
  PickupRequest,
  Receipt,
  User,
} from "./types";

export type Store = {
  users: Map<string, User>;
  collectors: Map<string, CollectorProfile>;
  pickups: Map<string, PickupRequest>;
  receipts: Map<string, Receipt>;
  ledger: PointsLedgerEntry[];
};

export function createStore(): Store {
  return {
    users: new Map(),
    collectors: new Map(),
    pickups: new Map(),
    receipts: new Map(),
    ledger: [],
  };
}

