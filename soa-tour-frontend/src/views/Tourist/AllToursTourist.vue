<!-- AllTours.vue -->
<template>
  <div class="tours-container">
    <h2 class="page-title">All Tours</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tours...</p>
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
            <span class="price">${{ formatPrice(tour.price) }}</span>
          </div>
          <div class="meta-item" v-if="tour.tags">
            <span class="meta-label">Tags:</span>
            <span class="tags">{{ tour.tags }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button @click="viewTourDetails(tour.id)" class="see-more-btn">
            See More →
          </button>

          <!-- Dugme za turiste -->
          <button
            v-if="isTourist"
            @click="addToCart(tour.id)"
            :disabled="cartTourIds.has(tour.id) || loadingCart[tour.id]"
            class="cart-btn"
            :class="{ 'in-cart': cartTourIds.has(tour.id) }"
          >
            <span v-if="loadingCart[tour.id]">...</span>
            <span v-else-if="cartTourIds.has(tour.id)">✓ In Cart</span>
            <span v-else>+ Add to Cart</span>
          </button>
        </div>

        <!-- Toast poruka po kartici -->
        <div v-if="toastMap[tour.id]" class="card-toast" :class="toastMap[tour.id].type">
          {{ toastMap[tour.id].message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "AllTours",
  data() {
    return {
      tours: [],
      loading: true,
      error: null,
      cartTourIds: new Set(),
      loadingCart: {},
      toastMap: {}
    };
  },
  computed: {
    isTourist() {
      const role = localStorage.getItem('role');
      return role === 'ROLE_TOURIST';
    }
  },
  mounted() {
    this.fetchTours();
    if (this.isTourist) {
      this.fetchCart();
    }
  },
  methods: {
    async fetchTours() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get('http://localhost:8000/tour/getAllActiveTours');
        this.tours = response.data;
      } catch (err) {
        this.error = 'Failed to load tours. Please try again.';
        console.error('Error fetching tours:', err);
      } finally {
        this.loading = false;
      }
    },

    async fetchCart() {
      // Učitaj korpu da znamo koje ture su već dodane
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/purchase/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ids = (res.data.items || []).map(i => Number(i.tour_id));
        this.cartTourIds = new Set(ids);
      } catch {
        // Korpa prazna ili greška — ignorisati
      }
    },

    async addToCart(tourId) {
      const token = localStorage.getItem('token');
      this.loadingCart = { ...this.loadingCart, [tourId]: true };
      try {
        await axios.post(
          'http://localhost:8000/purchase/add',
          { tour_id: tourId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.cartTourIds = new Set([...this.cartTourIds, tourId]);
        this.showCardToast(tourId, 'Added to cart!', 'success');
        this.$emit('cart-updated');
      } catch (err) {
        const msg = err.response?.data?.error || 'Could not add to cart.';
        this.showCardToast(tourId, msg, 'error');
      } finally {
        this.loadingCart = { ...this.loadingCart, [tourId]: false };
      }
    },

    showCardToast(tourId, message, type) {
      this.toastMap = { ...this.toastMap, [tourId]: { message, type } };
      setTimeout(() => {
        const updated = { ...this.toastMap };
        delete updated[tourId];
        this.toastMap = updated;
      }, 2500);
    },

    viewTourDetails(tourId) {
      this.$emit('view-tour', tourId);
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
  position: relative;
}

.tour-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.tour-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px 0;
  line-height: 1.3;
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

.difficulty-level.easy { background: #d1fae5; color: #065f46; }
.difficulty-level.moderate { background: #fef3c7; color: #92400e; }
.difficulty-level.hard { background: #fee2e2; color: #991b1b; }

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

.card-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.see-more-btn {
  flex: 1;
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 12px 16px;
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

.cart-btn {
  flex: 1;
  background: white;
  color: #2d6a4f;
  border: 2px solid #2d6a4f;
  padding: 10px 16px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.cart-btn:hover:not(:disabled) {
  background: #f0fdf4;
}

.cart-btn.in-cart {
  background: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
  cursor: default;
}

.cart-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.card-toast {
  position: absolute;
  bottom: 70px;
  left: 16px;
  right: 16px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  animation: fadeIn 0.2s ease;
}

.card-toast.success { background: #d1fae5; color: #065f46; }
.card-toast.error { background: #fee2e2; color: #991b1b; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
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