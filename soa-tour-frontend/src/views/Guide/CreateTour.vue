<template>
  <div class="create-tour-container">
    <div class="form-header">
      <h2 class="page-title">Create New Tour</h2>
      <p class="subtitle">Fill in the details to create your tour</p>
    </div>

    <form @submit.prevent="submitForm" class="tour-form">
      <div class="form-group">
        <label class="form-label">Tour Name *</label>
        <input
            type="text"
            v-model="form.name"
            class="form-input"
            :class="{ 'error': errors.name }"
            placeholder="e.g., Avala Adventure"
            required
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Description *</label>
        <textarea
            v-model="form.description"
            class="form-textarea"
            :class="{ 'error': errors.description }"
            placeholder="Describe your tour..."
            rows="4"
            required
        ></textarea>
        <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Difficulty *</label>
        <select v-model="form.difficulty" class="form-select" :class="{ 'error': errors.difficulty }">
          <option value="1">Easy</option>
          <option value="2">Moderate</option>
          <option value="3">Hard</option>
          <option value="4">Expert</option>
          <option value="5">Extreme</option>
        </select>
        <span v-if="errors.difficulty" class="error-message">{{ errors.difficulty }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Tags</label>
        <input
            type="text"
            v-model="tagsInput"
            class="form-input"
            placeholder="Enter tags separated by commas (e.g., hiking, nature, history)"
        />
        <div class="tags-preview" v-if="parsedTags.length">
          <span v-for="tag in parsedTags" :key="tag" class="tag-badge">
            {{ tag }}
          </span>
        </div>
        <span class="helper-text">Press space or comma to add tags</span>
      </div>

      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" :disabled="loading" class="btn btn-primary">
          <span v-if="loading" class="spinner-small"></span>
          <span v-else>Create Tour</span>
        </button>
      </div>
    </form>

    <div v-if="successMessage" class="success-message">
       {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="error-message-box">
       {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "CreateTour",
  data() {
    return {
      form: {
        name: '',
        description: '',
        difficulty: 2,
        tags: []
      },
      tagsInput: '',
      loading: false,
      successMessage: '',
      errorMessage: '',
      errors: {}
    };
  },
  computed: {
    parsedTags() {
      return this.form.tags;
    }
  },
  watch: {
    tagsInput(val) {
      // When user presses space or comma, add tag
      if (val.endsWith(' ') || val.endsWith(',')) {
        const newTag = val.slice(0, -1).trim();
        if (newTag && !this.form.tags.includes(newTag)) {
          this.form.tags.push(newTag);
        }
        this.tagsInput = '';
      }
    }
  },
  methods: {
    validateForm() {
      this.errors = {};
      if (!this.form.name.trim()) {
        this.errors.name = 'Tour name is required';
      }
      if (!this.form.description.trim()) {
        this.errors.description = 'Description is required';
      }
      return Object.keys(this.errors).length === 0;
    },

    async submitForm() {
      if (!this.validateForm()) return;

      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.errorMessage = 'Please login again';
          this.loading = false;
          return;
        }

        const requestData = {
          name: this.form.name,
          description: this.form.description,
          difficulty: parseInt(this.form.difficulty),
          tags: this.form.tags,
          status: "DRAFT",
          price: 0.0,
          author_id: parseInt(userId),
          totalDistance: 0.0
        };

        const response = await axios.post('http://localhost:8000/tour', requestData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-User-ID': userId
          }
        });

        if (response.status === 200 || response.status === 201) {
          this.successMessage = 'Tour created successfully!';
          this.resetForm();
          setTimeout(() => {
            this.$emit('tour-created');
          }, 1500);
        }
      } catch (err) {
        console.error('Error:', err);
        if (err.response) {
          console.log('Server error:', err.response.data);
          this.errorMessage = err.response.data?.message || err.response.data?.error || 'Failed to create tour';
        } else {
          this.errorMessage = 'Network error';
        }
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.form = {
        name: '',
        description: '',
        difficulty: 2,
        tags: []
      };
      this.tagsInput = '';
    },

    removeTag(tag) {
      this.form.tags = this.form.tags.filter(t => t !== tag);
    }
  }
};
</script>

<style scoped>
.create-tour-container {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  background: #f8fafc;
  border-radius: 24px;
  padding: 32px;
}

.form-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
}

.tour-form {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
  display: block;
}

.helper-text {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 6px;
  display: block;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-badge {
  background: #e2e8f0;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
}

.btn {
  padding: 12px 24px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background: #d1fae5;
  color: #065f46;
  border-radius: 12px;
  text-align: center;
}

.error-message-box {
  margin-top: 16px;
  padding: 12px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 12px;
  text-align: center;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>