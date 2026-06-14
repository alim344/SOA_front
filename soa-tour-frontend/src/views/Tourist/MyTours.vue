<template>
  <div class="tours-container">
    <h2 class="page-title">My Tours</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your tours...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchMyTours" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="tours.length === 0" class="empty-state">
      <p>You haven't purchased any tours yet.</p>
    </div>

    <div v-else class="tours-grid">
      <div v-for="tour in tours" :key="tour.id" class="tour-card">
        <div class="purchased-badge">✓ Purchased</div>
        <h3 class="tour-name">{{ tour.name }}</h3>
        <p class="tour-description">{{ truncateText(tour.description, 100) }}</p>

        <div class="tour-meta">
          <div class="meta-item">
            <span class="meta-label">Difficulty:</span>
            <span class="difficulty-level" :class="getDifficultyClass(tour.difficulty)">
              {{ getDifficultyText(tour.difficulty) }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Price:</span>
            <span class="price">${{ formatPrice(tour.price) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Distance:</span>
            <span class="distance">{{ tour.totalDistance?.toFixed(2) ?? 'N/A' }} km</span>
          </div>
          <div class="meta-item" v-if="tour.tags && tour.tags.length">
            <span class="meta-label">Tags:</span>
            <span class="tags">{{ tour.tags.join(', ') }}</span>
          </div>
        </div>

        <button @click="$emit('start-tour', tour.id)" class="see-more-btn">
          Start Tour →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MyTours',
  emits: ['start-tour'],
  data() {
    return {
      tours: [],
      loading: true,
      error: null,
    };
  },
  mounted() {
    this.fetchMyTours();
  },
  methods: {
    async fetchMyTours() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/purchase/my-tours', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.tours = response.data.tours ?? response.data;
      } catch (err) {
        this.error = 'Failed to load your tours.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    truncateText(text, maxLength) {
      if (!text) return 'No description available';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },

    formatPrice(price) {
      if (!price && price !== 0) return 'N/A';
      return price.toFixed(2);
    },

    getDifficultyText(level) {
      return { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' }[level] ?? 'Not rated';
    },

    getDifficultyClass(level) {
      if (level <= 2) return 'easy';
      if (level <= 3) return 'moderate';
      return 'hard';
    },
  },
};
</script>

<style scoped>
.tours-container {
  width: 100%;
  background: #f8fafc;
  border-radius: 24px;
  padding: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #eef2f6;
  display: flex;
  flex-direction: column;
  position: relative;
}

.tour-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.purchased-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #d1fae5;
  color: #065f46;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.tour-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
  padding-right: 80px;
}

.tour-description {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 16px;
}

.tour-meta {
  margin: 16px 0;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.meta-item:last-child { margin-bottom: 0; }

.meta-label {
  color: #64748b;
  font-weight: 500;
}

.difficulty-level {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}
.difficulty-level.easy     { background: #d1fae5; color: #065f46; }
.difficulty-level.moderate { background: #fef3c7; color: #92400e; }
.difficulty-level.hard     { background: #fee2e2; color: #991b1b; }

.price {
  font-weight: 700;
  color: #2d6a4f;
  font-size: 16px;
}

.distance {
  font-weight: 600;
  color: #2563eb;
}

.tags {
  color: #3b82f6;
  font-size: 12px;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 12px;
}

.see-more-btn {
  margin-top: auto;
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.see-more-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
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

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #2d6a4f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

</style>