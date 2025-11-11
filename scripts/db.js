// PROTOTYPE MODE: Minimal database for login/logout only
// All other data handling disabled per course requirements

const DB_KEY = "caphe_db_v1";

// Initialize default users in localStorage - PROTOTYPE ONLY
const DefaultDB = {
    users: [
        {
            id: "u1",
            email: "kh1@example.com",
            name: "Khách Hàng 1",
            phone: "0901000111",
            address: "HCM",
            password: "123456",
        },
        {
            id: "u2",
            email: "kh2@example.com",
            name: "Khách Hàng 2",
            phone: "0902000222",
            address: "HN",
            password: "123456",
        },
    ],
};

function initDB() {
    // Initialize DB if not exists
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
        localStorage.setItem(DB_KEY, JSON.stringify(DefaultDB));
        console.log("✓ DB initialized with default users");
    }
}
