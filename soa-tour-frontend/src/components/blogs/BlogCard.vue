<template>
  <div class="card" @click="$emit('open', blog)">
    <!-- Images -->
    <div v-if="blog.images && blog.images.length" class="card-img-row">
      <img
        v-for="(img, i) in blog.images.slice(0, 3)"
        :key="i"
        :src="img"
        class="card-img"
        :class="{ single: blog.images.length === 1 }"
        alt=""
      />
    </div>

    <div class="card-body">
      <div class="card-meta">
        <span class="author-chip">{{ blog.author_email }}</span>
        <span class="date">{{ formatDate(blog.created_at) }}</span>
      </div>

      <h2 class="card-title">{{ blog.title }}</h2>
      <p class="card-desc">{{ truncate(blog.description, 160) }}</p>

      <div class="card-footer" @click.stop>
        <button
          class="like-btn"
          :class="{ liked: blog.liked_by_me }"
          @click="$emit('like', blog.id)"
        >
          <span class="heart">{{ blog.liked_by_me ? '♥' : '♡' }}</span>
          {{ blog.like_count }}
        </button>

        <div v-if="showActions && blog.author_email === currentEmail" class="action-btns">
          <button class="action-btn edit-btn" @click="$emit('edit', blog)">Edit</button>
          <button class="action-btn del-btn" @click="$emit('delete', blog.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogCard',
  props: {
    blog: { type: Object, required: true },
    currentEmail: { type: String, default: '' },
    showActions: { type: Boolean, default: false },
  },
  emits: ['open', 'like', 'edit', 'delete'],

  methods: {
    formatDate(dt) {
      if (!dt) return ''
      return new Date(dt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    },
    truncate(text, max) {
      if (!text) return ''
      return text.length > max ? text.slice(0, max) + '…' : text
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');

.card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s;
  font-family: 'DM Sans', sans-serif;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.11);
}

.card-img-row {
  display: flex;
  gap: 2px;
  height: 200px;
  overflow: hidden;
}

.card-img {
  flex: 1;
  object-fit: cover;
  width: 0;
}

.card-img.single {
  width: 100%;
  flex: none;
}

.card-body {
  padding: 20px 24px 18px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.author-chip {
  font-size: 0.78rem;
  font-weight: 600;
  background: #eaf4e8;
  color: #2d6a4f;
  padding: 3px 10px;
  border-radius: 20px;
}

.date {
  font-size: 0.78rem;
  color: #a0aec0;
}

.card-title {
  font-family: 'Lora', serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a2c3e;
  margin-bottom: 8px;
  line-height: 1.35;
}

.card-desc {
  font-size: 0.88rem;
  color: #6b7a8d;
  line-height: 1.55;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: #f7f9fe;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  color: #6b7a8d;
  cursor: pointer;
  transition: all 0.15s;
}

.like-btn.liked {
  background: #fff0f0;
  border-color: #ffb3b3;
  color: #e53e3e;
}

.like-btn:hover {
  background: #fff0f0;
  border-color: #ffb3b3;
  color: #e53e3e;
}

.heart {
  font-size: 1rem;
  transition: transform 0.15s;
}

.like-btn:hover .heart,
.like-btn.liked .heart {
  transform: scale(1.2);
}

.action-btns {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s;
}

.edit-btn {
  background: #eef2fa;
  color: #2d6a4f;
}

.edit-btn:hover { background: #d8e8d8; }

.del-btn {
  background: #fff0f0;
  color: #e53e3e;
}

.del-btn:hover { background: #ffe0e0; }
</style>