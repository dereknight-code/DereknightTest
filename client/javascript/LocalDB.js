

window.onload = function () {
    db = new LocalDB(DB_CONFIG.name, DB_CONFIG.version, DB_CONFIG.stores);
    console.log("DB Initialized");
}


async function example() {
    try {
        // 1. 開庫與連結
        await myDB.open();

        // 2. 上傳資料 (Save)
        await myDB.saveData('return', { id: 'S002', name: '林宥學', class: '123' });

        // 3. 下載單筆資料 (Get)
        const data = await myDB.getData('return', 'S002');

        // 4. 下載全部資料 (Get All) -> 常用於產生列表
        const allStudents = await myDB.getAllData('return');

    } catch (error) {
        console.error("操作失敗:", error);
    }
}




class LocalDB {
    /**
     * 建構子
     * @param {string} dbName - 資料庫名稱
     * @param {number} version - 版本號 (修改 store 結構時需增加)
     * @param {Array} stores - 定義要建立的表格結構，例如: [{ name: 'users', keyPath: 'id' }]
     */
    constructor(dbName, version, stores) {
        this.dbName = dbName;
        this.version = version;
        this.stores = stores;
        this.db = null; // 儲存已開啟的資料庫實例
    }



    async saveData(name, data) {
        await this._open();
        await this._saveData(name, data);
        console.log("Data Save: ", data);
    }
    
    async add(name, data) {
        await this._open();
        await this._add(name, data);
        console.log("Data Save: ", data);
    }
    async getData(name, keyPath) {
        await this._open();
        let data = await this._getData(name, keyPath);
        console.log("Data Get: ", data);
        return data;
    }
    async getAllData(name) {
        await this._open();
        let alldata = await this._getAllData(name);
        console.log("All Data: ", alldata);
        return alldata;
    }

    /**
     * 1. 開啟並連結資料庫
     * @returns {Promise<IDBDatabase>}
     */
    _open() {
        return new Promise((resolve, reject) => {
            // 如果已經開啟過，直接回傳，避免重複開啟
            if (this.db) {
                return resolve(this.db);
            }

            const request = window.indexedDB.open(this.dbName, this.version);

            // 資料庫結構升級 (初次建立或版本號增加時觸發)
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log(`[IndexedDB] 升級中: v${this.version}`);

                this.stores.forEach(storeConfig => {
                    // 如果 ObjectStore 不存在，就建立它
                    if (!db.objectStoreNames.contains(storeConfig.name)) {
                        db.createObjectStore(storeConfig.name, {
                            keyPath: storeConfig.keyPath || 'id',
                            autoIncrement: storeConfig.autoIncrement || false
                        });
                        console.log(`[IndexedDB] 建立表格: ${storeConfig.name}`);
                    }
                });
            };

            // 開啟成功
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log(`[IndexedDB] 連線成功: ${this.dbName}`);
                resolve(this.db);
            };

            // 開啟失敗
            request.onerror = (event) => {
                console.error('[IndexedDB] 連線錯誤:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 2. 上傳資料 (新增或更新) - Upload/Save
     * @param {string} storeName - 表格名稱
     * @param {Object} data - 要儲存的物件
     * @returns {Promise<string>} 回傳成功訊息或 Key
     */
    _saveData(storeName, data) {
        return new Promise((resolve, reject) => {
            this._getTransaction(storeName, 'readwrite', (store) => {
                // put 方法：若 key 存在則更新，不存在則新增 (Upsert)
                const request = store.put(data);

                request.onsuccess = () => resolve('儲存成功');
                request.onerror = (e) => reject(e.target.error);
            });
        });
    }

    /**
     * 3. 下載資料 (讀取單筆) - Download/Get
     * @param {string} storeName 
     * @param {string|number} key - 主鍵值
     * @returns {Promise<Object>}
     */
    _getData(storeName, key) {
        return new Promise((resolve, reject) => {
            this._getTransaction(storeName, 'readonly', (store) => {
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        });
    }

    /**
     * 3.1 下載全部資料 (讀取該表所有資料) - Download All
     * @param {string} storeName 
     * @returns {Promise<Array>}
     */
    _getAllData(storeName) {
        return new Promise((resolve, reject) => {
            this._getTransaction(storeName, 'readonly', (store) => {
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e.target.error);
            });
        });
    }

    /**
     * 刪除資料 (額外功能)
     */
    _deleteData(storeName, key) {
        return new Promise((resolve, reject) => {
            this._getTransaction(storeName, 'readwrite', (store) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve('刪除成功');
                request.onerror = (e) => reject(e.target.error);
            });
        });
    }

    _add(storeName, item) {
        return new Promise((resolve, reject) => {
            this._getTransaction(storeName, 'readwrite', (store) => {
                const request = store.add(item); // 不要傳 id
                request.onsuccess = () => resolve(request.result); // result 為自動生成的 id
                request.onerror = () => reject(request.error);
            });
        });
    }


    // --- 內部輔助函式 (Helper) ---
    // 用來簡化 Transaction 的建立過程
    _getTransaction(storeName, mode, callback) {
        if (!this.db) {
            throw new Error("資料庫尚未開啟，請先呼叫 open()");
        }
        try {
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            callback(store);
        } catch (err) {
            console.error("[Transaction Error]", err);
        }
    }
}