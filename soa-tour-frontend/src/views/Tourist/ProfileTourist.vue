<template>
  <div class="profile-container">
    <h2 class="page-title">My Profile</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchProfile" class="retry-btn">Retry</button>
    </div>

    <div v-else class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <img
              v-if="profile.profilePhoto"
              :src="profile.profilePhoto"
              class="avatar-img"
          />
          <div v-else class="avatar-placeholder">
            {{ (profile.firstName?.charAt(0) || '') }}{{ (profile.lastName?.charAt(0) || '') }}
          </div>
        </div>
        <div class="profile-actions">
          <button v-if="!isEditing" @click="startEditing" class="edit-profile-btn">
            Edit Profile
          </button>
        </div>
      </div>

      <div v-if="!isEditing" class="profile-info">
        <div class="info-row">
          <span class="info-label">First Name:</span>
          <span class="info-value">{{ profile.firstName || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Last Name:</span>
          <span class="info-value">{{ profile.lastName || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Biography:</span>
          <span class="info-value bio-text">{{ profile.biography || 'No biography yet' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Motto:</span>
          <span class="info-value motto-text">{{ profile.motto || 'No motto yet' }}</span>
        </div>
      </div>

      <div v-else class="profile-edit">
        <div class="form-group">
          <label class="form-label">First Name</label>
          <input v-model="editForm.firstName" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Last Name</label>
          <input v-model="editForm.lastName" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Profile Photo URL</label>
          <input v-model="editForm.profilePhoto" class="form-input"  />
        </div>
        <div class="form-group">
          <label class="form-label">Biography</label>
          <textarea v-model="editForm.biography" class="form-textarea" rows="4" ></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Motto / Quote</label>
          <input v-model="editForm.motto" class="form-input" />
        </div>
        <div class="form-actions">
          <button @click="cancelEdit" class="cancel-btn">Cancel</button>
          <button @click="saveProfile" class="save-btn" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Profile',
  data() {
    return {
      profile: null,
      loading: true,
      saving: false,
      error: null,
      successMessage: '',
      isEditing: false,
      editForm: {
        firstName: '',
        lastName: '',
        profilePhoto: '',
        biography: '',
        motto: ''
      }
    };
  },
  mounted() {
    this.fetchProfile();
  },
  methods: {
    async fetchProfile() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/profiles/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.profile = response.data;
      } catch (err) {
        this.error = 'Failed to load profile. Please try again.';
        console.error('Error fetching profile:', err);
      } finally {
        this.loading = false;
      }
    },

    startEditing() {
      this.editForm = {
        firstName: this.profile.firstName || '',
        lastName: this.profile.lastName || '',
        profilePhoto: this.profile.profilePhoto || '',
        biography: this.profile.biography || '',
        motto: this.profile.motto || ''
      };
      this.isEditing = true;
      this.successMessage = '';
    },

    cancelEdit() {
      this.isEditing = false;
    },

    async saveProfile() {
      this.saving = true;
      this.error = null;
      this.successMessage = '';

      try {
        const token = localStorage.getItem('token');
        const response = await axios.put('http://localhost:8000/profiles/update', this.editForm, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        this.profile = response.data;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully!';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } catch (err) {
        this.error = 'Failed to update profile. Please try again.';
        console.error('Error updating profile:', err);
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.profile-container {
  background: #f8fafc;
  border-radius: 24px;
  padding: 24px;
  min-height: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.profile-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eef2f6;
}

.profile-header {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  padding: 32px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 36px;
  font-weight: 700;
  color: #2d6a4f;
  text-transform: uppercase;
}

.edit-profile-btn {
  background: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 14px;
  color: #2d6a4f;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-profile-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-info {
  padding: 32px;
}

.info-row {
  display: flex;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eef2f6;
}

.info-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.info-label {
  width: 120px;
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.5;
}

.bio-text, .motto-text {
  font-style: italic;
  color: #475569;
}

.profile-edit {
  padding: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
  font-size: 14px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}

.form-textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn, .save-btn {
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  border: none;
}

.cancel-btn {
  background: #f1f5f9;
  color: #475569;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.save-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  margin: 16px 24px 24px 24px;
  padding: 12px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  text-align: center;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
}

.retry-btn {
  background: #2d6a4f;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  margin-top: 16px;
}
</style>