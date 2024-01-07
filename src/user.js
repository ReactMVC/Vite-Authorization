import axios from 'axios';
import localForage from 'localforage';
import '/assets/main.css';

const apiUrl = import.meta.env.VITE_API_URL;

document.addEventListener('DOMContentLoaded', async () => {
    const authToken = await localForage.getItem('authToken');
    if (!authToken) {
        window.location.href = '/';
    } else {
        await validateTokenAndRedirect(authToken);
    }
});

async function validateTokenAndRedirect(token) {
    try {
        const response = await axios.get(`${apiUrl}/api/v1/account`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            displayUserData(response.data.data);
        }
    } catch (error) {
        console.error('Error validating token:', error);
        await localForage.removeItem('authToken');
        window.location.href = '/';
    }
}

function displayUserData(userData) {
    const app = document.getElementById('app');
    const { _id, name, email, role, active } = userData;

    app.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
        <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg p-6 rounded-xl shadow-lg max-w-lg w-full">
          <div class="flex flex-col items-center">
            <h1 class="text-4xl font-bold text-blue-500 mb-4">${name}</h1>
            <p class="text-gray-700 mb-2">Email: ${email}</p>
            <p class="text-gray-700 mb-4">User ID: ${_id}</p>
            <p class="text-gray-700 mb-2">Role: ${role === 0 ? 'Admin' : 'User'}</p>
            ${!active ? `<div class="alert bg-red-500 text-white px-4 py-3 rounded relative mb-4">Your account is not active.</div>` : ''}
            <div class="flex w-full">
              <button id="editProfileButton" class="mt-4 p-3 w-full rounded bg-green-500 text-white font-bold hover:bg-green-600 transition duration-300 ease-in-out mr-2">Edit Profile</button>
              <button id="logoutButton" class="mt-4 p-3 w-full rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition duration-300 ease-in-out">Logout</button>
            </div>
            <button id="deleteAccountButton" class="mt-4 p-3 w-full rounded bg-red-500 text-white font-bold hover:bg-red-600 transition duration-300 ease-in-out">Delete Account</button>
          </div>
        </div>
      </div>
    `;

    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', showLogoutConfirmLayout);

    const editProfileButton = document.getElementById('editProfileButton');
    editProfileButton.addEventListener('click', () => showEditProfileModal(userData));

    const deleteAccountButton = document.getElementById('deleteAccountButton');
    deleteAccountButton.addEventListener('click', () => showConfirmLayout(_id));
}

async function handleLogout() {
    await localForage.removeItem('authToken');
    window.location.href = '/';
}

function showLogoutConfirmLayout() {
    const logoutConfirmLayout = document.createElement('div');
    logoutConfirmLayout.innerHTML = `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="logoutConfirmModal">
    <div class="relative top-1/2 -translate-y-1/2 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
                <p>Are you sure you want to logout?</p>
                <div class="mt-4 flex justify-end space-x-3">
                    <button id="confirmLogout" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring">Yes</button>
                    <button id="cancelLogout" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring">No</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(logoutConfirmLayout);

    document.getElementById('confirmLogout').addEventListener('click', handleLogout);
    document.getElementById('cancelLogout').addEventListener('click', () => document.getElementById('logoutConfirmModal').remove());
}


function showConfirmLayout(userId) {
    const confirmLayout = document.createElement('div');
    confirmLayout.innerHTML = `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="confirmModal">
    <div class="relative top-1/2 -translate-y-1/2 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <p>Are you sure you want to delete your account?</p>
                <input type="password" id="confirmPassword" placeholder="Confirm your password" class="w-full p-2 rounded-md border border-gray-300 focus:ring focus:ring-blue-200 focus:outline-none transition duration-150 ease-in-out focus:border-blue-500 mt-3" />
                <div class="mt-3 flex justify-end">
                    <button id="confirmDelete" class="bg-red-500 text-white px-4 py-2 rounded mr-2">Yes</button>
                    <button id="cancelDelete" class="bg-gray-500 text-white px-4 py-2 rounded">No</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmLayout);

    document.getElementById('confirmDelete').addEventListener('click', () => handleDeleteAccount(userId));
    document.getElementById('cancelDelete').addEventListener('click', () => document.getElementById('confirmModal').remove());
}

async function handleDeleteAccount(userId) {
    const password = document.getElementById('confirmPassword').value;
    if (!password) {
        alert('Please enter your password.');
        return;
    }

    try {
        const authToken = await localForage.getItem('authToken');
        const response = await axios.delete(`${apiUrl}/api/v1/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                password: password
            }
        });

        if (response.status === 200) {
            alert('Account successfully deleted.');
            await localForage.removeItem('authToken');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('There was an error deleting your account.');
    }
}

function showEditProfileModal(userData) {
    const editProfileModal = document.createElement('div');
    editProfileModal.innerHTML = `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="editProfileModal">
        <div class="relative top-1/2 -translate-y-1/2 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
            <form id="editProfileForm">
                <input type="text" id="editName" placeholder="Name" class="w-full p-2 rounded-md border border-gray-300 focus:ring focus:ring-blue-200 focus:outline-none transition duration-150 ease-in-out focus:border-blue-500 mt-3" value="${userData.name}" required />
                <input type="email" id="editEmail" placeholder="Email" class="w-full p-2 rounded-md border border-gray-300 focus:ring focus:ring-blue-200 focus:outline-none transition duration-150 ease-in-out focus:border-blue-500 mt-3" value="${userData.email}" required />
                <input type="password" id="editPassword" placeholder="Password (leave blank to keep current)" class="w-full p-2 rounded-md border border-gray-300 focus:ring focus:ring-blue-200 focus:outline-none transition duration-150 ease-in-out focus:border-blue-500 mt-3" />
                <div class="mt-4 flex justify-end space-x-3">
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:outline-none focus:ring">Save Changes</button>
                    <button type="button" id="cancelEdit" class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring">Cancel</button>
                </div>
            </form>
        </div>
    </div>
    `;

    document.body.appendChild(editProfileModal);

    document.getElementById('editProfileForm').addEventListener('submit', (e) => handleEditProfile(e, userData._id));
    document.getElementById('cancelEdit').addEventListener('click', () => document.getElementById('editProfileModal').remove());
}

async function handleEditProfile(event, userId) {
    event.preventDefault();

    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;

    const updateData = {
        name: name,
        email: email
    };

    if (password) {
        updateData.password = password;
    }

    try {
        const authToken = await localForage.getItem('authToken');
        const response = await axios.patch(`${apiUrl}/api/v1/users/${userId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.status === 200) {
            alert('Profile successfully updated.');
            document.getElementById('editProfileModal').remove();
            displayUserData(response.data.data);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('There was an error updating your profile.');
    }
}