<template>
  <div class="register-container">
    <div class="register-content">
      <div class="register-card">
        <div class="logo">
          <span class="logo-text">Tour<span class="highlight">City</span></span>
        </div>

        <h1 class="title">Create Account</h1>
        <p class="subtitle">Join us and start your journey</p>

        <hr class="divider">

        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" v-model="registerData.firstName" placeholder="First name" />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" v-model="registerData.lastName" placeholder="Last name" />
          </div>
        </div>

        <div class="form-group">
          <label>Username</label>
          <input type="text" v-model="registerData.username" placeholder="Choose a username" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="registerData.email" placeholder="Enter your email" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="registerData.password" placeholder="Create a password" />
        </div>

        <div class="form-group">
          <label>I am a...</label>
          <div class="role-selector">
            <button
              class="role-btn"
              :class="{ active: registerData.role === 'ROLE_TOURIST' }"
              @click="registerData.role = 'ROLE_TOURIST'"
            >
              <span class="role-icon">🧳</span>
              Tourist
            </button>
            <button
              class="role-btn"
              :class="{ active: registerData.role === 'ROLE_GUIDE' }"
              @click="registerData.role = 'ROLE_GUIDE'"
            >
              <span class="role-icon">🗺️</span>
              Guide
            </button>
          </div>
        </div>

        <div class="form-group" v-if="registerData.role === 'ROLE_GUIDE'">
          <label>Motto <span class="optional">(optional)</span></label>
          <input type="text" v-model="registerData.motto" placeholder="Your guiding philosophy..." />
        </div>

        <button class="register-btn" @click="registerUser" :disabled="!isFormValid">Create Account</button>

        <p class="login-link">
          Already have an account? <router-link to="/login">Sign in</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'RegisterView',
  data() {
    return {
      registerData: {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'ROLE_TOURIST',
        motto: ''
      }
    };
  },
  computed: {
    isFormValid() {
      const { firstName, lastName, username, email, password } = this.registerData;
      return firstName.trim() && lastName.trim() && username.trim() && email.trim() && password.trim();
    }
  },
  methods: {
    async registerUser() {
      const { firstName, lastName, username, email, password, role } = this.registerData;
      if (!firstName || !lastName || !username || !email || !password) {
        alert('Please fill in all required fields.');
        return;
      }

      try {
        await axios.post('http://localhost:8000/auth/register', this.registerData);
        alert('Account created successfully! Please sign in.');
        this.$router.push('/');
      } catch (error) {
        if (error.response?.status === 409) {
          alert('An account with that email or username already exists.');
        } else {
          alert('Registration failed. Please try again.');
          console.error('Registration error:', error);
        }
      }
    }
  }
};
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
  padding: 32px 16px;
}

.register-card {
  background: white;
  border-radius: 24px;
  padding: 48px 40px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}

.logo { text-align: center; margin-bottom: 24px; }

.logo-text {
  font-size: 32px;
  font-weight: 700;
  color: #1a2c3e;
}

.logo-text .highlight {
  color: #2d6a4f;
  font-weight: 800;
}

.title {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}

.subtitle {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.divider {
  width: 15%;
  border: none;
  border-top: 4px solid #2d6a4f;
  border-radius: 4px;
  margin: 16px auto 28px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 12px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  transition: border 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}

.role-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.role-btn {
  padding: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.role-btn:hover {
  border-color: #2d6a4f;
  color: #2d6a4f;
}

.role-btn.active {
  border-color: #2d6a4f;
  background: #f0faf4;
  color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}

.role-icon {
  font-size: 18px;
}

.register-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
  font-family: inherit;
}

.register-btn:disabled {
  background: linear-gradient(135deg, #a8c5b8, #8aada0);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}



.login-link {
  text-align: center;
  font-size: 14px;
  color: #64748b;
}

.login-link a {
  color: #2d6a4f;
  font-weight: 600;
  text-decoration: none;
}

.login-link a:hover { text-decoration: underline; }
</style>