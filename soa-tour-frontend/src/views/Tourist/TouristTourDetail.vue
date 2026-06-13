<template>
  <div class="tour-detail-container">
    <button @click="$emit('back')" class="back-btn">← Back to Tours</button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tour details...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-btn">Retry</button>
    </div>

    <div v-else class="tour-detail">
      <div class="tour-header">
        <h1 class="tour-name">{{ tour.name }}</h1>
        <span class="status-badge published">Published</span>
      </div>

      <div class="tour-section">
        <h3 class="section-title">Description</h3>
        <p class="tour-description">{{ tour.description || 'No description available' }}</p>
      </div>

      <div class="tour-meta-grid">
        <div class="meta-card">
          <div class="meta-label">Difficulty</div>
          <div class="difficulty-level" :class="getDifficultyClass(tour.difficulty)">
            {{ getDifficultyText(tour.difficulty) }}
          </div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Price</div>
          <div class="price">${{ formatPrice(tour.price) }}</div>
        </div>
        <div class="meta-card" v-if="tour.totalDistance > 0">
          <div class="meta-label">Distance</div>
          <div class="distance">{{ tour.totalDistance.toFixed(2) }} km</div>
        </div>
        <div class="meta-card" v-if="tour.tags && tour.tags.length">
          <div class="meta-label">Tags</div>
          <div class="tags">{{ tour.tags.join(', ') }}</div>
        </div>
      </div>

      <div class="tour-section" v-if="tour.durationByTransport && Object.keys(tour.durationByTransport).length > 0">
        <h3 class="section-title">Estimated duration</h3>
        <div class="duration-list">
          <div v-for="(minutes, type) in tour.durationByTransport" :key="type" class="duration-item">
            <span class="duration-type">{{ getTransportName(type) }}</span>
            <span class="duration-minutes">{{ minutes }} min</span>
          </div>
        </div>
      </div>

      <div class="tour-section" v-if="firstKeyPoint">
        <h3 class="section-title">Starting point</h3>
        <div class="keypoint-card">
          <div class="keypoint-name">{{ firstKeyPoint.name }}</div>
          <div class="keypoint-description">{{ firstKeyPoint.description || 'No description' }}</div>
          <div class="keypoint-coords">
            {{ firstKeyPoint.latitude.toFixed(5) }}, {{ firstKeyPoint.longitude.toFixed(5) }}
          </div>
          <img v-if="firstKeyPoint.imagePath" :src="firstKeyPoint.imagePath" class="keypoint-image" />
        </div>
        <div v-if="keyPointsCount > 1" class="restriction-note">
          Additional {{ keyPointsCount - 1 }} key point(s) are locked. Purchase the tour to unlock all key points.
        </div>
      </div>

      <div class="tour-section">
        <h3 class="section-title">Reviews</h3>

        <div v-if="reviewsLoading" class="loading-reviews">Loading reviews...</div>
        <div v-else-if="reviews.length === 0" class="empty-reviews">
          No reviews yet.
        </div>
        <div v-else class="reviews-list">
          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <span class="reviewer-name">{{ review.touristName }} {{ review.touristSurname }}</span>
              <div class="review-rating">
                <span v-for="star in 5" :key="star" class="star">
                  {{ star <= review.rating ? '★' : '☆' }}
                </span>
              </div>
            </div>
            <div class="review-comment">{{ review.comment }}</div>
            <div class="review-meta">
              <span>Visited: {{ formatDate(review.visitDate) }}</span>
              <span>Posted: {{ formatDate(review.commentDate) }}</span>
            </div>
            <div v-if="review.images && review.images.length" class="review-images">
              <img v-for="img in review.images" :key="img" :src="img" class="review-img" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TouristTourDetail',
  props: {
    tourId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      tour: null,
      keyPoints: [],
      reviews: [],
      reviewsLoading: false,
      loading: true,
      error: null
    };
  },
  computed: {
    firstKeyPoint() {
      return this.keyPoints.length > 0 ? this.keyPoints[0] : null;
    },
    keyPointsCount() {
      return this.keyPoints.length;
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      this.error = null;
      try {
        await Promise.all([
          this.fetchTour(),
          this.fetchKeyPoints(),
          this.fetchReviews()
        ]);
      } catch (err) {
        this.error = 'Failed to load tour details';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async fetchTour() {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/tour/${this.tourId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      this.tour = {
        id: data.id,
        name: data.name,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        status: data.status,
        price: data.price,
        authorId: data.author_id,
        totalDistance: data.total_distance,
        durationByTransport: data.duration_by_transport,
        publishedAt: data.published_at,
        archivedAt: data.archived_at
      };

      console.log('Mapped tour:', this.tour);
      console.log('Duration:', this.tour.durationByTransport);
    },

    async fetchKeyPoints() {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/keypoint/getDtosByTour/${this.tourId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.keyPoints = response.data;
    },

    async fetchReviews() {
      this.reviewsLoading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/review/${this.tourId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.reviews = response.data;
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        this.reviewsLoading = false;
      }
    },

    formatPrice(price) {
      if (!price && price !== 0) return 'N/A';
      return price.toFixed(2);
    },

    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString();
    },

    getDifficultyText(level) {
      const levels = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' };
      return levels[level] || 'Not rated';
    },

    getDifficultyClass(level) {
      if (level <= 2) return 'easy';
      if (level <= 3) return 'moderate';
      return 'hard';
    },

    getTransportName(type) {
      const names = { 'WALKING': 'Walking', 'BIKE': 'Bike', 'CAR': 'Car' };
      return names[type] || type;
    }
  }
};
</script>

<style scoped>
.tour-detail-container {
  background: #f8fafc;
  border-radius: 24px;
  padding: 24px;
  min-height: 100%;
}

.back-btn {
  background: none;
  border: none;
  color: #2d6a4f;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  padding: 0;
  display: block;
  width: fit-content;
  text-align: left;
}

.back-btn:hover {
  color: #1b4d3e;
}

.tour-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.tour-name {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 30px;
}

.status-badge.published {
  background: #d1fae5;
  color: #065f46;
}

.tour-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  letter-spacing: -0.2px;
}

.tour-description {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.tour-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.meta-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.meta-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.difficulty-level {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  display: inline-block;
}

.difficulty-level.easy {
  background: #d1fae5;
  color: #065f46;
}

.difficulty-level.moderate {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-level.hard {
  background: #fee2e2;
  color: #991b1b;
}

.price, .distance {
  font-weight: 700;
  color: #2d6a4f;
  font-size: 18px;
}

.tags {
  background: #eff6ff;
  color: #3b82f6;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-block;
}

.duration-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.duration-item {
  background: white;
  padding: 8px 18px;
  border-radius: 30px;
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  border: 1px solid #e2e8f0;
}

.duration-type {
  font-weight: 500;
  color: #1e293b;
}

.duration-minutes {
  color: #2d6a4f;
  font-weight: 600;
}

.keypoint-card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.keypoint-name {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #0f172a;
}

.keypoint-description {
  font-size: 14px;
  color: #475569;
  margin-bottom: 8px;
}

.keypoint-coords {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.keypoint-image {
  margin-top: 12px;
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 12px;
}

.restriction-note {
  margin-top: 12px;
  font-size: 13px;
  color: #f59e0b;
  background: #fffbeb;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: white;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
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
  font-size: 14px;
}

.review-rating {
  color: #fbbf24;
  font-size: 13px;
  letter-spacing: 2px;
}

.review-comment {
  font-size: 14px;
  color: #334155;
  margin-bottom: 10px;
  line-height: 1.5;
}

.review-meta {
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.review-images {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.review-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

.empty-reviews, .loading-reviews {
  text-align: center;
  padding: 30px;
  background: white;
  border-radius: 16px;
  color: #64748b;
  font-size: 14px;
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