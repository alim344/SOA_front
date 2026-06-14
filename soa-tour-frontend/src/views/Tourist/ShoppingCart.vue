<template>
  <div class="cart-container">
    <div class="cart-header">
      <h2 class="page-title">🛒 My Cart</h2>
      <span v-if="!loading && items.length" class="item-count">{{ items.length }} tour{{ items.length > 1 ? 's' : '' }}</span>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your cart...</p>
    </div>

    <div v-else-if="error" class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h3>Your cart is empty</h3>
      <p>Browse tours and add them to your cart.</p>
      <button @click="$emit('go-to-tours')" class="browse-btn">Browse Tours</button>
    </div>

    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in items" :key="item.tour_id" class="cart-item">
          <div class="item-info">
            <h3 class="item-name">{{ item.tour_name }}</h3>
            <span class="item-price">${{ formatPrice(item.price) }}</span>
          </div>
          <button
            @click="removeFromCart(item.tour_id)"
            :disabled="removingId === item.tour_id"
            class="remove-btn"
          >
            {{ removingId === item.tour_id ? '...' : 'Remove' }}
          </button>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-card">
          <h3 class="summary-title">Order Summary</h3>
          <div class="summary-rows">
            <div v-for="item in items" :key="item.tour_id" class="summary-row">
              <span class="summary-tour-name">{{ item.tour_name }}</span>
              <span>${{ formatPrice(item.price) }}</span>
            </div>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-total">
            <span>Total</span>
            <span class="total-price">${{ formatPrice(totalPrice) }}</span>
          </div>
          <button @click="checkout" :disabled="checkingOut" class="checkout-btn">
            {{ checkingOut ? 'Processing...' : 'Checkout' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>

    <div v-if="checkoutDone" class="modal-overlay" @click.self="checkoutDone = false">
      <div class="modal">
        <div class="modal-icon">🎉</div>
        <h3>Purchase Successful!</h3>
        <p>You received {{ purchaseTokens.length }} token{{ purchaseTokens.length > 1 ? 's' : '' }} for your tours.</p>
        <div class="tokens-list">
          <div v-for="(token, i) in purchaseTokens" :key="i" class="token-item">
            <span class="token-label">Tour {{ i + 1 }}</span>
            <code class="token-value">{{ token }}</code>
          </div>
        </div>
        <button @click="checkoutDone = false; $emit('go-to-tours')" class="modal-btn">
          Browse More Tours
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ShoppingCart',
  emits: ['go-to-tours', 'cart-updated'],
  data() {
    return {
      items: [],
      totalPrice: 0,
      loading: true,
      error: null,
      removingId: null,
      checkingOut: false,
      checkoutDone: false,
      purchaseTokens: [],
      toast: null
    };
  },
  mounted() {
    this.fetchCart();
  },
  methods: {
    async fetchCart() {
      this.loading = true;
      this.error = null;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/purchase/cart', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.items = res.data.items || [];
        this.totalPrice = res.data.total_price || 0;
      } catch (err) {
        this.error = 'Failed to load cart. Please try again.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async removeFromCart(tourId) {
      this.removingId = tourId;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          'http://localhost:8000/purchase/remove',
          { tour_id: tourId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.items = res.data.items || [];
        this.totalPrice = res.data.total_price || 0;
        this.$emit('cart-updated');
        this.showToast('Tour removed from cart.', 'info');
      } catch (err) {
        this.showToast('Failed to remove tour.', 'error');
      } finally {
        this.removingId = null;
      }
    },

    async checkout() {
      this.checkingOut = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          'http://localhost:8000/purchase/checkout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.purchaseTokens = res.data.tokens || [];
        this.items = [];
        this.totalPrice = 0;
        this.checkoutDone = true;
        this.$emit('cart-updated');
      } catch (err) {
        this.showToast('Checkout failed. Please try again.', 'error');
      } finally {
        this.checkingOut = false;
      }
    },

    showToast(message, type = 'success') {
      this.toast = { message, type };
      setTimeout(() => { this.toast = null; }, 3000);
    },

    formatPrice(price) {
      if (!price && price !== 0) return '0.00';
      return Number(price).toFixed(2);
    }
  }
};
</script>

<style scoped>
.cart-container {
  width: 100%;
  background: #f8fafc;
  border-radius: 24px;
  padding: 24px;
  min-height: 400px;
  position: relative;
}

.cart-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.item-count {
  background: #2d6a4f;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 20px;
}

.browse-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s;
}

.browse-btn:hover {
  box-shadow: 0 4px 12px rgba(45, 106, 79, 0.3);
  transform: translateY(-1px);
}

.cart-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  background: white;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #eef2f6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.cart-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.item-price {
  font-size: 18px;
  font-weight: 700;
  color: #2d6a4f;
}

.remove-btn {
  background: white;
  color: #ef4444;
  border: 1.5px solid #fca5a5;
  padding: 8px 18px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) { background: #fee2e2; }
.remove-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.summary-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #eef2f6;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  position: sticky;
  top: 24px;
}

.summary-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
}

.summary-tour-name {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 16px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
}

.total-price { color: #2d6a4f; font-size: 20px; }

.checkout-btn {
  width: 100%;
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 40px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.checkout-btn:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(45, 106, 79, 0.35);
  transform: translateY(-1px);
}

.checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 28px;
  border-radius: 40px;
  font-weight: 600;
  font-size: 14px;
  z-index: 1000;
  animation: slideUp 0.3s ease;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.toast.success { background: #2d6a4f; color: white; }
.toast.error   { background: #ef4444; color: white; }
.toast.info    { background: #475569; color: white; }

@keyframes slideUp {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: white;
  border-radius: 24px;
  padding: 40px 36px;
  max-width: 480px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-icon { font-size: 52px; margin-bottom: 16px; }

.modal h3 {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.modal p { color: #64748b; margin-bottom: 20px; }

.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  max-height: 180px;
  overflow-y: auto;
}

.token-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.token-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.token-value {
  font-size: 11px;
  color: #2d6a4f;
  word-break: break-all;
  text-align: right;
}

.modal-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 13px 32px;
  border-radius: 40px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn:hover { box-shadow: 0 4px 14px rgba(45, 106, 79, 0.3); }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #2d6a4f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>