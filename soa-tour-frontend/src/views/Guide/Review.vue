<template>
  <div class="review-wrapper">
    <div class="review-container">
      <h2 class="page-title">Leave a Review</h2>

      <div class="form-group">
        <label class="form-label">Tour ID</label>
        <input
            type="number"
            v-model="tourId"
            class="form-input"
            placeholder="Enter tour ID"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Rating</label>
        <div class="rating-stars">
          <span
              v-for="star in 5"
              :key="star"
              @click="form.rating = star"
              class="star"
              :class="{ active: star <= form.rating }"
          >
            ★
          </span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Comment</label>
        <textarea
            v-model="form.comment"
            rows="4"
            class="form-textarea"
            placeholder="Share your experience..."
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Date of Visit</label>
        <input type="date" v-model="form.visitDate" class="form-input" />
      </div>

      <div class="form-group">
        <label class="form-label">Images (optional)</label>
        <input
            type="file"
            @change="handleImageUpload"
            multiple
            accept="image/*"
            class="file-input"
        />
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

      <div v-if="fetchedReviews.length > 0" class="reviews-section">
        <h3 class="section-title">Reviews ({{ fetchedReviews.length }})</h3>
        <div v-for="review in fetchedReviews" :key="review.id" class="review-item">
          <div class="review-header">
            <strong class="reviewer-name">{{ review.touristName }} {{ review.touristSurname }}</strong>
            <div class="review-rating">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</div>
          </div>
          <div class="review-field">
            <span class="field-label">Comment:</span>
            <span class="field-value">{{ review.comment }}</span>
          </div>
          <div class="review-field">
            <span class="field-label">Visit Date:</span>
            <span class="field-value">{{ formatDate(review.visitDate) }}</span>
          </div>
          <div class="review-field" v-if="review.commentDate">
            <span class="field-label">Posted:</span>
            <span class="field-value">{{ formatDate(review.commentDate) }}</span>
          </div>
          <div v-if="review.images?.length" class="review-images">
            <img v-for="img in review.images" :key="img" :src="img" class="review-img" />
          </div>
        </div>
      </div>

      <!-- Load Reviews Button -->
      <button @click="fetchReviews" class="fetch-btn" v-if="tourId">Load Reviews</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "CreateSimpleReview",
  data() {
    return {
      tourId: null,
      form: {
        rating: 5,
        comment: "",
        visitDate: new Date().toISOString().split("T")[0],
      },
      imageUrls: [],
      submitting: false,
      successMessage: "",
      errorMessage: "",
      fetchedReviews: [],
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
      event.target.value = "";
    },
    removeImage(idx) {
      this.imageUrls.splice(idx, 1);
    },
    async submitReview() {
      if (!this.tourId || !this.form.comment) {
        this.errorMessage = "Tour ID and comment are required";
        return;
      }
      this.submitting = true;
      this.successMessage = "";
      this.errorMessage = "";

      try {
        const token = localStorage.getItem("token");
        await axios.post(
            `http://localhost:8000/review/${this.tourId}`,
            {
              rating: this.form.rating,
              comment: this.form.comment,
              visitDate: this.form.visitDate + "T00:00:00",
              images: this.imageUrls,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        this.successMessage = "Review submitted!";
        this.form.comment = "";
        this.form.rating = 5;
        this.imageUrls = [];
        await this.fetchReviews();
        setTimeout(() => (this.successMessage = ""), 3000);
      } catch (err) {
        this.errorMessage = err.response?.status === 403 ? "Tour must be PUBLISHED" : "Submission failed";
      } finally {
        this.submitting = false;
      }
    },
    async fetchReviews() {
      if (!this.tourId) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/review/${this.tourId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.fetchedReviews = res.data;
      } catch (err) {
        this.fetchedReviews = [];
      }
    },
    formatDate(date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-GB");
    },
  },
};
</script>

<style scoped>
.review-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 32px;
  background: #f1f5f9;
}

.review-container {
  max-width: 540px;
  width: 100%;
  background: white;
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin-bottom: 28px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 6px;
}

.form-input,
.form-textarea,
.file-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  font-size: 14px;
  font-family: inherit;
  transition: 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}

.rating-stars {
  display: flex;
  gap: 6px;
}

.star {
  font-size: 32px;
  cursor: pointer;
  color: #cbd5e1;
  transition: 0.1s;
}

.star.active {
  color: #fbbf24;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.preview-img {
  position: relative;
  width: 70px;
  height: 70px;
}

.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.remove-img {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
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
  font-size: 15px;
  cursor: pointer;
  transition: 0.2s;
  margin-top: 8px;
}

.submit-btn:hover {
  background: #1b4d3e;
  transform: translateY(-1px);
}

.success-message,
.error-message {
  text-align: center;
  font-size: 13px;
  padding: 10px;
  border-radius: 40px;
  margin-top: 16px;
}

.success-message {
  background: #e6f9ed;
  color: #2c6e4f;
}

.error-message {
  background: #fff0f0;
  color: #c2412c;
}

.reviews-section {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e9edf2;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #0f172a;
}

.review-item {
  background: #f8fafc;
  border-radius: 20px;
  padding: 14px;
  margin-bottom: 14px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reviewer-name {
  font-weight: 600;
  color: #0f172a;
}

.review-rating {
  color: #fbbf24;
  font-size: 13px;
}

.review-field {
  margin-bottom: 6px;
  font-size: 13px;
}

.field-label {
  font-weight: 500;
  color: #5b6e8c;
  margin-right: 8px;
}

.field-value {
  color: #1e293b;
}

.review-images {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.review-img {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  object-fit: cover;
}

.fetch-btn {
  width: 100%;
  background: #eef2ff;
  border: none;
  padding: 10px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 500;
  color: #2d6a4f;
  margin-top: 20px;
  cursor: pointer;
}
</style>