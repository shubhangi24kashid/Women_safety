// Function to toggle menu on smaller screens
function toggleMenu() {
  const menu = document.querySelector('nav ul');
  menu.classList.toggle('show');
}

// Handle user signup
async function signup(event) {
  event.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const response = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    if (response.ok) {
      alert('Signup successful! Please login to continue.');
      window.location.href = 'login.html';
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to signup.');
    }
  } catch (error) {
    console.error('Error signing up:', error);
    alert('Failed to signup: ' + error.message);
  }
}

// Handle user login
async function login(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const user = await response.json();
      alert(`Welcome ${user.name}! You are now logged in.`);
      localStorage.setItem('isAuthenticated', 'true'); // Set authentication status
      window.location.href = 'home.html'; // Redirect to home page after successful login
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Invalid credentials.');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    alert('Failed to login: ' + error.message);
  }
}

// Handle SOS button click
async function sendSOS() {
  const emergencyMessage = "Emergency! Please help! This is from Shubhangi Kashid.";

  try {
    const response = await fetch('/sendEmergencyAlert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: emergencyMessage })
    });

    if (response.ok) {
      alert('Emergency SOS sent to contacts!');
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send SOS.');
    }
  } catch (error) {
    console.error('Error sending SOS:', error);
    alert('Failed to send SOS: ' + error.message);
  }
}

// Ensure authentication state is checked on page load
window.onload = function() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (isAuthenticated) {
    // Display full navigation for authenticated users
    document.querySelectorAll('.auth-links').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.auth-action').forEach(el => el.style.display = 'none');
  } else {
    // Display login/signup options
    document.querySelectorAll('.auth-links').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.auth-action').forEach(el => el.style.display = 'block');
  }
}

// Logout function
function logout() {
  localStorage.setItem('isAuthenticated', 'false');
  window.location.href = 'login.html';
}
function toggleMenu() {
  const menu = document.querySelector('nav ul.menu');
  menu.classList.toggle('show');
}

function sendSOS() {
  alert("SOS message sent!");
  // Add SOS logic here
}

function logout() {
  alert("Logging out...");
  // Add logout logic here
}
function logout() {
  // Remove the authentication state from local storage
  localStorage.removeItem('isAuthenticated');
  
  // Redirect to the index page
  window.location.href = 'index.html';
}

