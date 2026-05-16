
<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-card">
        <div class="logo">
          <span class="logo-text">Tour<span class="highlight">City</span></span>
        </div>

        <h1 class="title">Welcome Back</h1>
        <p class="subtitle">Sign in to continue your journey</p>

        <hr class="divider">

        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="loginData.email" placeholder="Enter your email" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input type="password" v-model="loginData.password" placeholder="Enter your password" />
        </div>

        <button class="login-btn" @click="loginUser">Sign In</button>

       
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginView',
  data() {
    return {
      loginData: { email: '', password: '' }
    };
  },
  mounted() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  },
  methods: {
    async loginUser() {
  try {
    const response = await axios.post('http://localhost:8000/auth/login', this.loginData);
    const auth = response.data; 
    
    localStorage.setItem('token', auth.token);
    localStorage.setItem('role', auth.role);

    const userResponse = await axios.get('http://localhost:8000/auth/userEnabled', {
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
    });
    
    localStorage.setItem('userId', userResponse.data.id);

    if (auth.role === 'ROLE_GUIDE') {
      this.$router.push('/guideView');
    } else if (auth.role === 'ROLE_TOURIST') {
      this.$router.push('/touristView');
    } else {
      alert('Unknown role: ' + auth.role);
    }

  } catch (error) {
    alert('Login failed. Check your credentials.');
    console.error("Greška pri login-u:", error);
  }
}
  }
};
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
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

.login-btn {
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

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(45, 106, 79, 0.3);
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #64748b;
}

.register-link a {
  color: #2d6a4f;
  font-weight: 600;
  text-decoration: none;
}

.register-link a:hover { text-decoration: underline; }
</style>