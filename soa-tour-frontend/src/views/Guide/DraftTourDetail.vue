<template>
  <div class="tour-detail-container">
    <button @click="$emit('back')" class="back-btn">← Back to Drafts</button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tour...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchTour" class="retry-btn">Retry</button>
    </div>

    <div v-else class="tour-detail">

      <div class="tour-header">
        <h1 class="tour-name">{{ tour.name }}</h1>
        <span class="status-badge" :class="getStatusClass(tour.status)">
          {{ tour.status }}
        </span>
      </div>

      <div class="tour-section">
        <h3 class="section-title">Description</h3>
        <p class="tour-description">{{ tour.description || 'No description available' }}</p>
      </div>

      <div class="tour-meta-grid">
        <div class="meta-card">
          <span class="meta-label">Difficulty</span>
          <span class="difficulty-level" :class="getDifficultyClass(tour.difficulty)">
            {{ getDifficultyText(tour.difficulty) }}
          </span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Price</span>
          <span class="price">${{ formatPrice(tour.price) }}</span>
        </div>
        <div class="meta-card" v-if="tour.tags">
          <span class="meta-label">Tags</span>
          <span class="tags">{{ tour.tags }}</span>
        </div>
      </div>

      <div class="tour-section" v-if="tour.keyPoints && tour.keyPoints.length">
        <h3 class="section-title">Key Points</h3>
        <div class="keypoints-grid">
          <div v-for="point in tour.keyPoints" :key="point.id" class="keypoint-card">
            <h4 class="keypoint-name">{{ point.name }}</h4>
            <p class="keypoint-description">{{ point.description || 'No description' }}</p>
            <div class="keypoint-coords">
              {{ point.latitude }}, {{ point.longitude }}
            </div>
            <img v-if="point.imagePath" :src="point.imagePath" class="keypoint-image" />
          </div>
        </div>
      </div>

      <div class="publish-wrapper" v-if="tour.status === 'DRAFT'">
        <button @click="publishTour" class="publish-btn">
          Publish Tour
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'DraftTourDetail',
  props: {
    tourId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      tour: null,
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchTour();
  },
  methods: {
    async fetchTour() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/tour/${this.tourId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.tour = response.data;
      } catch (err) {
        this.error = 'Failed to load tour. Please try again.';
        console.error('Error fetching tour:', err);
      } finally {
        this.loading = false;
      }
    },

    editTour() {
      this.$emit('edit-tour', this.tourId);
    },

    async publishTour() {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8000/tour/${this.tourId}/publish`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        await this.fetchTour();
        this.$emit('tour-published');
      } catch (err) {
        alert('Tour must have at least 2 key points to publish');
      }
    },

    formatPrice(price) {
      if (!price && price !== 0) return 'N/A';
      return price.toFixed(2);
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

    getStatusClass(status) {
      return status === 'DRAFT' ? 'status-draft' : 'status-published';
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
  padding: 8px 0;
  display: flex;
;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
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

.status-badge.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-published {
  background: #d1fae5;
  color: #065f46;
}

.tour-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.tour-description {
  font-size: 15px;
  line-height: 1.6;
  color: #334155;
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.tour-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.difficulty-level {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
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

.price {
  font-weight: 700;
  color: #2d6a4f;
  font-size: 18px;
}

.tags {
  background: #eff6ff;
  color: #3b82f6;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  display: inline-block;
}

.keypoints-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.keypoint-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.keypoint-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.keypoint-description {
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
}

.keypoint-coords {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.keypoint-image {
  margin-top: 12px;
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}


.publish-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.publish-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 40px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 106, 79, 0.3);
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