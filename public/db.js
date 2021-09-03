let db, 
budgetVer;

//makes a new database req for Budget database
const request = indexedDB.open("BudgetDB", budgetVer || 21);

function checkDatabase() {
    console.log("Check db function running");

    //initiates transaction on budget db
    let transaction = db.transaction(["BudgetStore"], "readwrite");

    //access BudgetStore object
    const store = transaction.objectStore("BudgetStore");

    //get all records from store and set to variable
    const getAll = store.getAll();

    //upon a successful request
    getAll.onsuccess = function () {
        console.log("getAll on success running");
        //if items are in store, utilize bulk and add them when back application is online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => response.json())
            .then((res) => {
                //if returned response is not empy
                if (res.length !== 0) {
                    //open another transaction with read/write abilities
                    transaction = db.transaction(["BudgetStore"], "readwrite");

                    //gives the most current store to a var
                    const currentStore = transaction.objectStore("BudgetStore");

                    //clear old entries to add new bulk entries
                    currentStore.clear();
                    console.log("Storage now being cleared");
                }
            });
        }
    };
};

request.onupgradeneeded = function (event) {
    console.log("Need to upgrade indexDB");

    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`DataBase updated from ver ${oldVersion} to ${newVersion}`);

    db = event.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore("BudgetStore", { autoIncrement: true });
    }
};

request.onerror = function (event) {
    console.log(`Error!: ${event.target.errorCode}`);
};

request.onsuccess = function (event) {
    console.log("Success message");
    db = event.target.result;

    //see if app is online before reading from db
    if (navigator.onLine) {
        console.log('Application is online and is now reading from db');
        checkDatabase();
      }
};

const saveRecord = (record) => {
    console.log("Save record function ran");
    //create transaction on the BudgetStore DB with readwrite access
    const transaction = db.transaction(["BudgetStore"], "readwrite");

    //gives us access BudgetStore
    const store = transaction.objectStore("BudgetStore");

    //add record
    store.add(record);
};

//utilizes event listener to see if db back online
window.addEventListener("online", checkDatabase);