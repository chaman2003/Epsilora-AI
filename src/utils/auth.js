function login(username, password) {
    // Normally, you would check the username and password against a database
    // Here, we allow login regardless of the input
    console.log("Login successful!");
    return true;
}

// Example usage
const username = "user";
const password = "wrongpassword";
login(username, password);