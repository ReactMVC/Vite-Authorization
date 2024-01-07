import axios from 'axios';
import localForage from 'localforage';
import '/assets/main.css';

const apiUrl = import.meta.env.VITE_API_URL;

document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');

    app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-900 px-4 sm:px-6 lg:px-8">
    <div class="bg-gray-800 bg-opacity-60 backdrop-filter backdrop-blur-lg p-4 sm:p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 class="text-4xl font-bold text-blue-500 mb-2">Register</h1>
          <p class="text-gray-300 mb-8">Create your account.</p>
          <form id="registerForm" class="flex flex-col">
            <input type="text" id="name" placeholder="Name" class="mb-4 p-3 rounded bg-gray-700 text-white" required />
            <input type="email" id="email" placeholder="Email" class="mb-4 p-3 rounded bg-gray-700 text-white" required />
            <input type="password" id="password" placeholder="Password" class="mb-4 p-3 rounded bg-gray-700 text-white" required />
            <button type="submit" id="registerButton" class="mb-4 p-3 rounded bg-blue-500 text-white font-bold hover:bg-blue-600">Register</button>
            <div id="alert" class="hidden"></div>
            <a href="/" class="text-blue-400 hover:text-blue-300 text-sm mt-4">Do you have an account? log in</a>
          </form>
        </div>
      </div>
    `;

    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);

    try {
        const authToken = await localForage.getItem('authToken');
        if (authToken) {
            await validateTokenAndRedirect(authToken);
        }
    } catch (error) {
        console.error('Error checking auth token:', error);
    }
});

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const registerButton = document.getElementById('registerButton');

    if (!name || !email || !password) {
        showAlert('Name, email, and password are required.', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showAlert('Please enter a valid email address.', 'error');
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';

    try {
        const response = await axios.post(`${apiUrl}/api/v1/users`, { name, email, password });
        await localForage.setItem('authToken', response.data.token);
        window.location.href = '/pages/user.html';
    } catch (error) {
        showAlert(error.response?.data?.message || 'An error occurred while registering.', 'error');
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function showAlert(message, type) {
    const alertBox = document.getElementById('alert');
    alertBox.className = `alert ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white px-4 py-3 rounded relative`;
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 3000);
}

async function validateTokenAndRedirect(token) {
    try {
        const response = await axios.get(`${apiUrl}/api/v1/account`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            window.location.href = '/pages/user.html';
        }
    } catch (error) {
        console.error('Error validating token:', error);
        await localForage.removeItem('authToken');
        showAlert('Session expired. Please log in again.', 'error');
    }
}