<template>
  <div class="reviews-container">
    <h2 class="page-title">Leave a Review</h2>
    <p class="subtitle">Select a tour you want to review</p>

    <div v-if="loading" class="loading-state">Loading tours...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="tours-grid">
      <div v-for="tour in tours" :key="tour.id" class="tour-card" @click="selectTour(tour)">
        <h3 class="tour-name">{{ tour.name }}</h3>
        <p class="tour-description">{{ truncateText(tour.description, 80) }}</p>
        <div class="tour-meta">
          <span class="difficulty" :class="getDifficultyClass(tour.difficulty)">
            {{ getDifficultyText(tour.difficulty) }}
          </span>
          <span class="price">${{ tour.price?.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedTour" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal">✖</button>
        <h3>Review: {{ selectedTour.name }}</h3>
        <ReviewForm :tour-id="selectedTour.id" @submitted="onReviewSubmitted" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ReviewForm from './ReviewForm.vue';

export default {
  name: 'ReviewTours',
  components: { ReviewForm },
  data() {
    return {
      tours: [],
      loading: true,
      error: null,
      selectedTour: null
    };
  },
  mounted() {
    this.fetchTours();
  },
  methods: {
    async fetchTours() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/tour/getAllActiveTours', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.tours = res.data;
      } catch (err) {
        this.error = 'Failed to load tours';
      } finally {
        this.loading = false;
      }
    },
    selectTour(tour) {
      this.selectedTour = tour;
    },
    closeModal() {
      this.selectedTour = null;
    },
    onReviewSubmitted() {
      this.closeModal();
      alert('Review submitted!');
    },
    truncateText(text, max) {
      if (!text) return 'No description';
      return text.length > max ? text.substring(0, max) + '...' : text;
    },
    getDifficultyText(level) {
      const levels = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' };
      return levels[level] || 'N/A';
    },
    getDifficultyClass(level) {
      if (level <= 2) return 'easy';
      if (level <= 3) return 'moderate';
      return 'hard';
    }
  }
};
</script>

<style scoped>
.reviews-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100%;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.subtitle {
  color: #64748b;
  margin-bottom: 24px;
}
.tours-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.tour-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}
.tour-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.tour-name {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.tour-description {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
}
.tour-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.difficulty {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
}
.difficulty.easy { background: #d1fae5; color: #065f46; }
.difficulty.moderate { background: #fef3c7; color: #92400e; }
.difficulty.hard { background: #fee2e2; color: #991b1b; }
.price {
  font-weight: 700;
  color: #2d6a4f;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 24px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
.loading-state, .error-state {
  text-align: center;
  padding: 60px;
}
</style>