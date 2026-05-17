<template>
  <div class="tours-container">
    <h2 class="page-title">My Tours</h2>

    <div v-if="loading" class="loading-state">
      <p>Loading your tours...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchTours" class="retry-btn">Retry</button>
    </div>

    <div v-else class="tours-grid">
      <div v-for="tour in tours" :key="tour.id" class="tour-card">
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
            <span class="price">${{ tour.price?.toFixed(2) }}</span>
          </div>
        </div>

        <button @click="$emit('manage-keypoints', tour.id)" class="manage-btn">
          Manage Key Points →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

//const AUTHOR_ID = 1;  //HARDKODOVANO DOK GATEWAZ NE NAMESTIMO


export default {
  name: 'MyTours',
  emits: ['manage-keypoints'],
  data() {
    return {
      tours: [],
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchTours();
  },
  methods: {
    async fetchTours() {
      this.loading = true;
      this.error = null;

      
        const token = localStorage.getItem('token');
         const authorId = localStorage.getItem('userId');
        if (!token) {
          this.errorMessage = 'You must be logged in to see ur tours';
          return;
        }

      try {
        const response = await axios.get(`http://localhost:8000/tour/nodraft/guide/${authorId}`,{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        this.tours = response.data;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #eef2f6;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}
.tour-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
.tour-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}
.tour-description {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 12px;
}
.tour-meta {
  margin: 12px 0;
  padding: 10px 0;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}
.meta-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}
.meta-label { color: #64748b; font-weight: 500; }
.difficulty-level {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}
.difficulty-level.easy { background: #d1fae5; color: #065f46; }
.difficulty-level.moderate { background: #fef3c7; color: #92400e; }
.difficulty-level.hard { background: #fee2e2; color: #991b1b; }
.price { font-weight: 700; color: #2d6a4f; font-size: 16px; }
.manage-btn {
  margin-top: auto;
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}
.manage-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(45,106,79,0.3);
}
.loading-state, .error-state { text-align: center; padding: 60px 20px; }


</style>