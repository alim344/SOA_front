<template>
  <div class="tours-container">
    <h2 class="page-title">Draft Tours</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading draft tours...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchDrafts" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="drafts.length === 0" class="empty-state">
      <p>No draft tours yet.</p>
      <button @click="$emit('create-tour')" class="create-btn">+ Create Tour</button>
    </div>

    <div v-else class="tours-grid">
      <div v-for="tour in drafts" :key="tour.id" class="tour-card">
        <div class="tour-header">
          <h3 class="tour-name">{{ tour.name }}</h3>
          <span class="status-badge draft">DRAFT</span>
        </div>

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
          <div class="meta-item" v-if="tour.tags">
            <span class="meta-label">Tags:</span>
            <span class="tags">{{ tour.tags }}</span>
          </div>
        </div>

        <button @click="editDraft(tour.id)" class="see-more-btn">
          See More →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "DraftTours",
  data() {
    return {
      drafts: [],
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchDrafts();
  },
  methods: {
    async fetchDrafts() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/tour/author', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        this.drafts = response.data.filter(tour => tour.status === 'DRAFT');
      } catch (err) {
        this.error = 'Failed to load draft tours. Please try again.';
        console.error('Error fetching drafts:', err);
      } finally {
        this.loading = false;
      }
    },

    editDraft(tourId) {
      this.$emit('edit-draft', tourId);
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
      const levels = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' };
      return levels[level] || 'Not rated';
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
}

.tour-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.tour-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tour-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.status-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 20px;
}

.status-badge.draft {
  background: #fef3c7;
  color: #92400e;
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

.meta-item:last-child {
  margin-bottom: 0;
}

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
  font-size: 16px;
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
}

.retry-btn, .create-btn {
  background: #2d6a4f;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  margin-top: 16px;
}
</style>