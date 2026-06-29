const STORAGE_PREFIX = "ALW_STANDALONE_DB_";

const DEFAULT_BRANDING = {
  companyBrand: "AL WAFA STAR",
  companySubtitle: "ERP Smart Control v2.5",
  profileUser: "Superintendent Hamdy",
  profileEmail: "allitokmal@gmail.com",
  profileAvatarUrl: "",
  appPassword: "123456"
};

const DEFAULT_USERS = [
  { id: "user-admin", username: "admin", passwordPlain: "admin123", role: "Admin" },
  { id: "user-moderator", username: "moderator", passwordPlain: "mod123", role: "Moderator" },
  { id: "user-visitor", username: "visitor", passwordPlain: "visitor123", role: "Visitor" }
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.warn('Local database operation:', operationType, path, error);
}

export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined) return "" as any;
  if (data === null) return null as any;
  if (Array.isArray(data)) {
    return data.map(sanitizeFirestoreData) as any;
  }
  if (typeof data === 'object') {
    const cleanObj: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        cleanObj[key] = sanitizeFirestoreData(val);
      }
    }
    return cleanObj;
  }
  return data;
}

// In-memory subscribers list
const subscribers: Record<string, Set<(data: any) => void>> = {};

// Helper to broadcast changes
function notifySubscribers(key: string, data: any) {
  if (subscribers[key]) {
    subscribers[key].forEach(cb => cb(data));
  }
}

// Set up storage event listener for cross-tab updates
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key && event.key.startsWith(STORAGE_PREFIX)) {
      const dbKey = event.key.substring(STORAGE_PREFIX.length);
      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        if (dbKey.startsWith("store_")) {
          const storeKey = dbKey.substring("store_".length);
          notifySubscribers("store_" + storeKey, newValue);
        } else {
          notifySubscribers(dbKey, newValue);
        }
      } catch (e) {
        console.warn("Cross-tab storage synchronization issue", e);
      }
    }
  });
}

// Read-only helper for pure LocalStorage documents
async function getLocalDocuments<T>(collName: string): Promise<T[]> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + collName);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

export async function saveDocument(collName: string, docId: string, data: any): Promise<any> {
  const cleanData = sanitizeFirestoreData(data);
  try {
    const list = await getLocalDocuments<any>(collName);
    const existingIndex = list.findIndex(r => r.id === docId);
    const recordPayload = { ...cleanData, id: docId };
    if (existingIndex >= 0) {
      list[existingIndex] = recordPayload;
    } else {
      list.push(recordPayload);
    }
    localStorage.setItem(STORAGE_PREFIX + collName, JSON.stringify(list));
    notifySubscribers(collName, list);
  } catch (e) {
    console.warn("Local persistence write error", e);
  }
  return { ...cleanData, id: docId };
}

export async function saveDocumentsBulk(collName: string, items: any[]): Promise<void> {
  try {
    const list = await getLocalDocuments<any>(collName);
    for (const item of items) {
      const cleanData = sanitizeFirestoreData(item);
      if (!cleanData.id) continue;
      const existingIndex = list.findIndex(r => r.id === cleanData.id);
      const recordPayload = { ...cleanData };
      if (existingIndex >= 0) {
        list[existingIndex] = recordPayload;
      } else {
        list.push(recordPayload);
      }
    }
    localStorage.setItem(STORAGE_PREFIX + collName, JSON.stringify(list));
    notifySubscribers(collName, list);
  } catch (e) {
    console.warn("Local persistence bulk write error", e);
  }
}

export async function deleteDocument(collName: string, docId: string): Promise<void> {
  try {
    const list = await getLocalDocuments<any>(collName);
    const filtered = list.filter(r => r.id !== docId);
    localStorage.setItem(STORAGE_PREFIX + collName, JSON.stringify(filtered));
    notifySubscribers(collName, filtered);
  } catch (e) {
    console.warn("Local persistence delete error", e);
  }
}

export async function getDocuments<T>(collName: string): Promise<T[]> {
  return getLocalDocuments<T>(collName);
}

export async function getStoreValue<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + "store_" + key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return defaultVal;
}

export async function saveStoreValue<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(STORAGE_PREFIX + "store_" + key, JSON.stringify(value));
    notifySubscribers("store_" + key, value);
  } catch (err) {
    console.warn("Local storage save error", err);
  }
}

export async function getBrandingData(): Promise<typeof DEFAULT_BRANDING> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + "branding");
    if (raw) {
      return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_BRANDING;
}

export async function saveBrandingData(data: any): Promise<void> {
  try {
    const current = await getBrandingData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_PREFIX + "branding", JSON.stringify(updated));
    notifySubscribers("branding", updated);
  } catch (e) {}
}

export async function getRegisteredUsers(): Promise<any[]> {
  const localUsers = await getLocalDocuments<any>("users");
  if (localUsers.length === 0) {
    localStorage.setItem(STORAGE_PREFIX + "users", JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return localUsers;
}

export async function saveRegisteredUsers(users: any[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_PREFIX + "users", JSON.stringify(users));
    notifySubscribers("users", users);
  } catch (e) {}
}

export function subscribeCollection<T>(
  collName: string, 
  onUpdate: (data: T[]) => void
): () => void {
  if (!subscribers[collName]) {
    subscribers[collName] = new Set();
  }
  subscribers[collName].add(onUpdate);
  
  // Immediately invoke with current local data
  getLocalDocuments<T>(collName).then(onUpdate);

  return () => {
    subscribers[collName]?.delete(onUpdate);
  };
}

export function subscribeStoreValue<T>(
  key: string, 
  defaultVal: T, 
  onUpdate: (value: T) => void
): () => void {
  const subKey = "store_" + key;
  if (!subscribers[subKey]) {
    subscribers[subKey] = new Set();
  }
  subscribers[subKey].add(onUpdate);

  // Immediately invoke with current local data
  getStoreValue<T>(key, defaultVal).then(onUpdate);

  return () => {
    subscribers[subKey]?.delete(onUpdate);
  };
}

export function subscribeBrandingData(
  onUpdate: (branding: typeof DEFAULT_BRANDING) => void
): () => void {
  const subKey = "branding";
  if (!subscribers[subKey]) {
    subscribers[subKey] = new Set();
  }
  subscribers[subKey].add(onUpdate);

  // Immediately invoke with current local data
  getBrandingData().then(onUpdate);

  return () => {
    subscribers[subKey]?.delete(onUpdate);
  };
}

export function subscribeRegisteredUsers(
  onUpdate: (users: any[]) => void
): () => void {
  const subKey = "users";
  if (!subscribers[subKey]) {
    subscribers[subKey] = new Set();
  }
  subscribers[subKey].add(onUpdate);

  // Immediately invoke with current local data
  getRegisteredUsers().then(onUpdate);

  return () => {
    subscribers[subKey]?.delete(onUpdate);
  };
}
