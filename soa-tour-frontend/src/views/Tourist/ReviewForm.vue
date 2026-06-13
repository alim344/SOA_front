<template>
  <div class="review-form">
    <div class="form-group">
      <label>Rating</label>
      <div class="rating-stars">
        <span v-for="star in 5" :key="star" @click="form.rating = star"
              class="star" :class="{ active: star <= form.rating }">★</span>
      </div>
    </div>

    <div class="form-group">
      <label>Comment</label>
      <textarea v-model="form.comment" rows="3" class="form-input" placeholder="Your experience..."></textarea>
    </div>

    <div class="form-group">
      <label>Date of Visit</label>
      <input type="date" v-model="form.visitDate" class="form-input" />
    </div>

    <div class="form-group">
      <label class="form-label">Images (optional)</label>

      <div class="upload-area" @click="triggerFileInput">
        <input
            type="file"
            ref="fileInput"
            @change="handleImageUpload"
            multiple
            accept="image/*"
            class="hidden-input"
        />
        <div class="upload-content">
          <span class="upload-text">Click to add photos</span>
        </div>
      </div>

      <div class="image-preview" v-if="imageUrls.length">
        <div v-for="(url, idx) in imageUrls" :key="idx" class="preview-img">
          <img :src="url" />
          <button type="button" @click="removeImage(idx)" class="remove-img">✖</button>
        </div>
      </div>
    </div>
    <button @click="submitReview" class="submit-btn" :disabled="submitting">
      {{ submitting ? 'Submitting...' : 'Submit Review' }}
    </button>

    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ReviewForm',
  props: {
    tourId: {
      type: Number,
      required: true
    }
  },
  emits: ['submitted'],
  data() {
    return {
      form: {
        rating: 5,
        comment: '',
        visitDate: new Date().toISOString().split('T')[0]
      },
      imageUrls: [],
      submitting: false,
      successMessage: '',
      errorMessage: ''
    };
  },
  methods: {
    handleImageUpload(event) {
      const files = Array.from(event.target.files);
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = () => this.imageUrls.push(reader.result);
        reader.readAsDataURL(file);
      }
      event.target.value = '';
    },
    removeImage(idx) {
      this.imageUrls.splice(idx, 1);
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    async submitReview() {
      if (!this.form.comment) {
        this.errorMessage = 'Please enter a comment';
        return;
      }
      this.submitting = true;
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:8000/review/${this.tourId}`, {
          rating: this.form.rating,
          comment: this.form.comment,
          visitDate: this.form.visitDate + 'T00:00:00',
          images: this.imageUrls
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.successMessage = 'Review submitted!';
        this.form.comment = '';
        this.form.rating = 5;
        this.imageUrls = [];
        setTimeout(() => this.successMessage = '', 3000);
        this.$emit('submitted');
      } catch (err) {
        this.errorMessage = err.response?.status === 403 ? 'Tour must be PUBLISHED' : 'Submission failed';
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.review-form {
  margin-top: 16px;
}
.rating-stars {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.star {
  font-size: 28px;
  cursor: pointer;
  color: #cbd5e1;
}
.star.active {
  color: #fbbf24;
}
.form-group {
  margin-bottom: 16px;
}
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
}
.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.preview-img {
  position: relative;
  width: 60px;
  height: 60px;
}
.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.remove-img {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  cursor: pointer;
}
.submit-btn {
  width: 100%;
  background: #2d6a4f;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
}
.success-message {
  text-align: center;
  color: #065f46;
  margin-top: 12px;
}
.error-message {
  text-align: center;
  color: #c2412c;
  margin-top: 12px;
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.upload-area:hover {
  border-color: #2d6a4f;
  background: #f1f5f9;
}

.hidden-input {
  display: none;
}

.upload-content {
  padding: 24px;
  text-align: center;
}

.upload-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.upload-text {
  display: block;
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
}

.upload-hint {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Image preview */
.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.preview-img {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-img:hover {
  background: #dc2626;
  transform: scale(1.1);
}
</style>