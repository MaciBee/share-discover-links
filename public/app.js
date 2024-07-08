document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Show response message from server
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to register');
    });
});
